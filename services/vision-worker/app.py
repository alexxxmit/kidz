import os
import base64
from functools import lru_cache
from io import BytesIO
from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
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


class CutoutImageResponse(BaseModel):
    status: Literal["ready"] = "ready"
    provider: str = "rembg-u2netp"
    image_base64: str
    mime_type: Literal["image/png"] = "image/png"
    transparent_background: Literal[True] = True


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
    alpha_box = image.getchannel("A").getbbox()
    if alpha_box:
        image = image.crop(alpha_box)
        pad = max(20, round(max(image.size) * 0.05))
        canvas = Image.new("RGBA", (image.width + pad * 2, image.height + pad * 2), (0, 0, 0, 0))
        canvas.alpha_composite(image, (pad, pad))
        image = canvas
    output = BytesIO()
    image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
    image.save(output, format="PNG", optimize=True)
    return CutoutImageResponse(image_base64=base64.b64encode(output.getvalue()).decode("ascii"))
