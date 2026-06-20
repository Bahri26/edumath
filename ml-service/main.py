"""
Edumath ML Service — bağımsız Python mikroservis.
Yerel algoritmalar: soru ayrıştırma, çözüm, analiz, zayıf konu skorlama.
"""

from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from services.health import health_payload
from services.question_analyze import analyze_question
from services.question_generate import generate_questions_from_pool
from services.question_parse import enrich_question, parse_structured_question_text
from services.question_solver import solve_pattern_question
from services.weak_topics import rank_weak_topics, score_topic_entries

load_dotenv()

HOST = os.getenv("ML_SERVICE_HOST", "0.0.0.0")
PORT = int(os.getenv("PORT") or os.getenv("ML_SERVICE_PORT", "8100"))
API_KEY = os.getenv("ML_SERVICE_API_KEY", "").strip()

app = FastAPI(
    title="Edumath ML Service",
    description="Yerel soru çözümü, ayrıştırma ve öğrenci konu analizi (dış AI yok)",
    version="0.2.1",
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


class QuestionPayload(BaseModel):
    text: str = ""
    questionText: str = ""
    introText: str = ""
    stepLabels: str = ""
    ocrText: str = ""
    ocrPreview: str = ""
    topic: str = ""
    difficulty: str = ""
    correctAnswer: str = ""
    solution: str = ""
    options: list[str] = Field(default_factory=list)


class ParseTextRequest(BaseModel):
    ocrText: str = Field(min_length=1)
    defaults: dict[str, Any] = Field(default_factory=dict)


class PoolSample(BaseModel):
    text: str = ""
    options: list[str] = Field(default_factory=list)
    correctAnswer: str = ""
    solution: str = ""
    topic: str = ""
    difficulty: str = ""
    learningOutcome: str = ""
    subject: str = ""
    classLevel: str = ""


class GenerateFromPoolRequest(BaseModel):
    topic: str = ""
    difficulty: str = "Orta"
    count: int = Field(default=5, ge=1, le=20)
    classLevel: str = ""
    subject: str = "Matematik"
    poolSamples: list[PoolSample] = Field(default_factory=list)


def _check_api_key(x_api_key: str | None) -> None:
    if not API_KEY:
        return
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Geçersiz ML servis anahtarı")


@app.get("/health")
def health() -> dict[str, Any]:
    payload = health_payload()
    payload["version"] = "0.2.1"
    payload["capabilities"] = [
        "weak-topics",
        "question-solve",
        "question-parse",
        "question-analyze",
        "question-enrich",
        "question-generate-from-pool",
    ]
    payload["engine"] = "edumath-local"
    return payload


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


@app.post("/questions/solve")
def questions_solve(
    body: QuestionPayload,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict[str, Any]:
    _check_api_key(x_api_key)
    result = solve_pattern_question(body.model_dump())
    if not result:
        return {"success": False, "message": "Bu soru tipi için yerel çözücü eşleşmedi.", "data": None}
    return {"success": True, "data": result, "engine": "edumath-local"}


@app.post("/questions/analyze")
def questions_analyze(
    body: QuestionPayload,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict[str, Any]:
    _check_api_key(x_api_key)
    return {"success": True, "data": analyze_question(body.model_dump()), "engine": "edumath-local"}


@app.post("/questions/parse-text")
def questions_parse_text(
    body: ParseTextRequest,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict[str, Any]:
    _check_api_key(x_api_key)
    data = parse_structured_question_text(body.ocrText, body.defaults)
    return {"success": True, "data": data, "engine": "edumath-local"}


@app.post("/questions/enrich")
def questions_enrich(
    body: QuestionPayload,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict[str, Any]:
    """OCR/metin + şıklar → konu, zorluk, doğru cevap, çözüm (tek çağrı)."""
    _check_api_key(x_api_key)
    data = enrich_question(body.model_dump())
    return {"success": True, "data": data, "engine": "edumath-local"}


@app.post("/questions/generate-from-pool")
def questions_generate_from_pool(
    body: GenerateFromPoolRequest,
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict[str, Any]:
    """Soru havuzundan esinlenerek yeni sorular üret (birebir kopya yok)."""
    _check_api_key(x_api_key)
    payload = body.model_dump()
    result = generate_questions_from_pool(payload)
    return {"success": True, "data": result, "engine": "edumath-local"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
