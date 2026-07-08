import os
from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field


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


app = FastAPI(title="Kidz Vision Worker", version="0.1.0")


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
