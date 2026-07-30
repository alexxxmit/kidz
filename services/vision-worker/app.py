import os
import base64
import json
import math
import subprocess
import tempfile
from functools import lru_cache
from io import BytesIO
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps, ImageStat
from pydantic import BaseModel, Field
from rembg import new_session, remove


class AnalyzeRequest(BaseModel):
    object_key: str = Field(min_length=1, max_length=1024)
    locale: Literal["ru", "en"] = "ru"


class Attribute(BaseModel):
    value: str | int | list[str]
    confidence: float = Field(ge=0, le=1)
    source: Literal["MODEL_INFERRED", "LABEL_OCR", "USER_CONFIRMED"]


class AnalyzeResponse(BaseModel):
    status: Literal["draft"] = "draft"
    provider: str
    attributes: dict[str, Attribute]
    requires_confirmation: list[str]


class CutoutRequest(BaseModel):
    object_key: str = Field(min_length=1, max_length=1024)


class CutoutResponse(BaseModel):
    status: Literal["mock_ready", "ready", "failed"] = "mock_ready"
    provider: str
    source_object_key: str
    cutout_object_key: str
    transparent_background: bool


class CutoutImageRequest(BaseModel):
    image_base64: str = Field(min_length=128, max_length=20_000_000)
    normalize_flat_lay: bool = True


class CutoutImageResponse(BaseModel):
    status: Literal["ready"] = "ready"
    provider: str = "rembg-u2netp+flatlay"
    image_base64: str
    mime_type: Literal["image/png"] = "image/png"
    transparent_background: Literal[True] = True
    normalized: bool
    rotation_degrees: float


class VideoFrame(BaseModel):
    image_base64: str
    mime_type: Literal["image/jpeg"] = "image/jpeg"
    timestamp_ms: int


class VideoFramesResponse(BaseModel):
    status: Literal["ready"] = "ready"
    provider: str = "ffmpeg-scene-dedupe"
    frames: list[VideoFrame]
    sampled_frames: int


app = FastAPI(title="Kidz Vision Worker", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",")],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["content-type"],
)


@lru_cache(maxsize=1)
def cutout_session():
    return new_session("u2netp")


def alpha_crop_and_pad(image: Image.Image) -> Image.Image:
    alpha_box = image.getchannel("A").getbbox()
    if not alpha_box:
        return image
    cropped = image.crop(alpha_box)
    pad = max(20, round(max(cropped.size) * 0.05))
    canvas = Image.new(
        "RGBA",
        (cropped.width + pad * 2, cropped.height + pad * 2),
        (0, 0, 0, 0),
    )
    canvas.alpha_composite(cropped, (pad, pad))
    return canvas


def normalize_flat_lay(image: Image.Image) -> tuple[Image.Image, float]:
    """Deskew the foreground without regenerating garment pixels or details."""
    alpha = np.asarray(image.getchannel("A"))
    points = np.argwhere(alpha > 40)
    if len(points) < 200:
        return alpha_crop_and_pad(image), 0.0
    if len(points) > 120_000:
        points = points[:: max(1, len(points) // 120_000)]
    y = points[:, 0].astype(float)
    x = points[:, 1].astype(float)
    covariance = np.cov(np.stack([x, -y]))
    values, vectors = np.linalg.eigh(covariance)
    axis = vectors[:, int(np.argmax(values))]
    angle = math.degrees(math.atan2(axis[1], axis[0])) % 180
    target = 0.0 if min(angle, 180 - angle) <= abs(angle - 90) else 90.0
    delta = target - angle
    if delta < -90:
        delta += 180
    if delta > 90:
        delta -= 180
    # Correct ordinary camera/placement skew only. Larger changes can rotate a
    # naturally wide garment in the wrong direction.
    if abs(delta) < 1.25 or abs(delta) > 22:
        delta = 0.0
    if delta:
        image = image.rotate(delta, resample=Image.Resampling.BICUBIC, expand=True)
    return alpha_crop_and_pad(image), round(delta, 2)


def perceptual_signature(image: Image.Image) -> tuple[int, tuple[float, float, float]]:
    fitted = ImageOps.fit(image.convert("RGB"), (48, 48), method=Image.Resampling.LANCZOS)
    grayscale = fitted.convert("L").resize((9, 8), Image.Resampling.LANCZOS)
    pixels = np.asarray(grayscale)
    bits = pixels[:, 1:] > pixels[:, :-1]
    hash_value = 0
    for bit in bits.flatten():
        hash_value = (hash_value << 1) | int(bit)
    mean = ImageStat.Stat(fitted).mean
    return hash_value, (mean[0], mean[1], mean[2])


def is_duplicate(
    signature: tuple[int, tuple[float, float, float]],
    existing: list[tuple[int, tuple[float, float, float]]],
) -> bool:
    value, color = signature
    for other_value, other_color in existing:
        hash_distance = (value ^ other_value).bit_count()
        color_distance = math.sqrt(sum((a - b) ** 2 for a, b in zip(color, other_color)))
        if hash_distance <= 9 and color_distance <= 34:
            return True
    return False


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "kidz-vision-worker",
        "provider": os.getenv("VISION_PROVIDER", "mock"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/v1/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    # Provider boundary is live; the mock keeps manual confirmation as the safe fallback
    # until a zero-retention vision provider and object storage are configured.
    return AnalyzeResponse(
        provider=os.getenv("VISION_PROVIDER", "mock"),
        attributes={
            "category": Attribute(value="tshirt", confidence=0.42, source="MODEL_INFERRED"),
            "slot": Attribute(value="top", confidence=0.7, source="MODEL_INFERRED"),
            "colors": Attribute(value=["unknown"], confidence=0.1, source="MODEL_INFERRED"),
            "warmth": Attribute(value=1, confidence=0.4, source="MODEL_INFERRED"),
        },
        requires_confirmation=["category", "colors", "warmth"],
    )


@app.post("/v1/cutout", response_model=CutoutResponse)
def cutout(request: CutoutRequest):
    # This is a provider boundary, not real segmentation. Production should replace it
    # with a zero-retention background-removal/segmentation provider and store the PNG
    # with transparent background as cutout_object_key.
    return CutoutResponse(
        provider=os.getenv("VISION_PROVIDER", "mock"),
        source_object_key=request.object_key,
        cutout_object_key=f"mock-cutout/{request.object_key}",
        transparent_background=False,
    )


@app.post("/v1/cutout-image", response_model=CutoutImageResponse)
def cutout_image(request: CutoutImageRequest):
    encoded = request.image_base64.split(",", 1)[-1]
    source = base64.b64decode(encoded, validate=True)
    if len(source) > 12 * 1024 * 1024:
        raise ValueError("Image exceeds 12 MB")
    result = remove(source, session=cutout_session(), post_process_mask=True)
    image = Image.open(BytesIO(result)).convert("RGBA")
    rotation = 0.0
    if request.normalize_flat_lay:
        image, rotation = normalize_flat_lay(image)
    else:
        image = alpha_crop_and_pad(image)
    output = BytesIO()
    image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
    image.save(output, format="PNG", optimize=True)
    return CutoutImageResponse(
        image_base64=base64.b64encode(output.getvalue()).decode("ascii"),
        normalized=request.normalize_flat_lay,
        rotation_degrees=rotation,
    )


@app.post("/v1/video-frames", response_model=VideoFramesResponse)
async def video_frames(file: UploadFile = File(...)):
    content_type = (file.content_type or "").lower()
    if not content_type.startswith("video/"):
        raise HTTPException(status_code=415, detail="A video file is required")
    source = await file.read(45 * 1024 * 1024 + 1)
    if len(source) > 45 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Video exceeds 45 MB")
    suffix = Path(file.filename or "closet.mp4").suffix.lower()
    if suffix not in {".mp4", ".mov", ".m4v", ".webm"}:
        suffix = ".mp4"
    with tempfile.TemporaryDirectory(prefix="mira-video-") as directory:
        source_path = Path(directory) / f"source{suffix}"
        source_path.write_bytes(source)
        try:
            probe = subprocess.run(
                [
                    "ffprobe", "-v", "error", "-show_entries", "format=duration",
                    "-of", "json", str(source_path),
                ],
                capture_output=True,
                check=True,
                text=True,
                timeout=12,
            )
            duration = float(json.loads(probe.stdout)["format"]["duration"])
        except (subprocess.SubprocessError, KeyError, ValueError, json.JSONDecodeError):
            raise HTTPException(status_code=422, detail="Video could not be read") from None
        if duration <= 0 or duration > 35:
            raise HTTPException(status_code=422, detail="Video must be between 1 and 35 seconds")
        interval = max(0.8, duration / 16)
        frame_pattern = str(Path(directory) / "frame-%03d.jpg")
        try:
            subprocess.run(
                [
                    "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(source_path),
                    "-t", str(min(duration, 35)), "-vf",
                    f"fps=1/{interval:.4f},scale='min(720,iw)':-2",
                    "-q:v", "3", frame_pattern,
                ],
                capture_output=True,
                check=True,
                timeout=45,
            )
        except subprocess.SubprocessError:
            raise HTTPException(status_code=422, detail="Video frames could not be extracted") from None

        frame_paths = sorted(Path(directory).glob("frame-*.jpg"))
        signatures: list[tuple[int, tuple[float, float, float]]] = []
        selected: list[VideoFrame] = []
        for index, frame_path in enumerate(frame_paths):
            image = Image.open(frame_path).convert("RGB")
            signature = perceptual_signature(image)
            if is_duplicate(signature, signatures):
                continue
            signatures.append(signature)
            output = BytesIO()
            image.save(output, format="JPEG", quality=78, optimize=True)
            selected.append(
                VideoFrame(
                    image_base64=base64.b64encode(output.getvalue()).decode("ascii"),
                    timestamp_ms=round(index * interval * 1000),
                )
            )
            if len(selected) >= 8:
                break
        if not selected:
            raise HTTPException(status_code=422, detail="No usable wardrobe frames found")
        return VideoFramesResponse(frames=selected, sampled_frames=len(frame_paths))
