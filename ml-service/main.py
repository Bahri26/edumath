"""
Edumath ML Service — bağımsız Python mikroservis.
Backend (Node) ile HTTP üzerinden konuşur; backend/ içinde değildir.
"""

from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from services.health import health_payload
from services.weak_topics import rank_weak_topics, score_topic_entries

load_dotenv()

HOST = os.getenv("ML_SERVICE_HOST", "0.0.0.0")
PORT = int(os.getenv("PORT") or os.getenv("ML_SERVICE_PORT", "8100"))
API_KEY = os.getenv("ML_SERVICE_API_KEY", "").strip()

app = FastAPI(
    title="Edumath ML Service",
    description="Öğrenci konu analizi ve zayıf alan skorlama",
    version="0.1.0",
)


class TopicEntry(BaseModel):
    topic: str = "Genel"
    total: float = 0
    correct: float = 0
    accuracy: float = 0
    avgTimeMs: float = 0
    mastery: float = 0
    suggested: bool = False


class AnalyzeTopicsRequest(BaseModel):
    entries: list[TopicEntry] = Field(default_factory=list)
    limit: int = Field(default=5, ge=1, le=20)
    weakThreshold: float | None = Field(default=None, ge=0, le=1)


def _check_api_key(x_api_key: str | None) -> None:
    if not API_KEY:
        return
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Geçersiz ML servis anahtarı")


@app.get("/health")
def health() -> dict[str, Any]:
    return health_payload()


@app.post("/analyze/topics")
def analyze_topics(
    body: AnalyzeTopicsRequest,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict[str, Any]:
    _check_api_key(x_api_key)
    payload = [entry.model_dump() for entry in body.entries]
    return rank_weak_topics(
        payload,
        limit=body.limit,
        weak_threshold=body.weakThreshold,
    )


@app.post("/score/topics")
def score_topics(
    body: AnalyzeTopicsRequest,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict[str, Any]:
    _check_api_key(x_api_key)
    payload = [entry.model_dump() for entry in body.entries]
    scored = score_topic_entries(payload, weak_threshold=body.weakThreshold)
    return {"topics": scored}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
