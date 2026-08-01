import importlib

from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["engine"] == "edumath-local"
    assert "question-solve" in body["capabilities"]


def test_analyze_topics_endpoint():
    resp = client.post(
        "/analyze/topics",
        json={
            "entries": [
                {"topic": "Örüntüler", "total": 10, "correct": 4, "accuracy": 0.4, "mastery": 0.4},
                {"topic": "Geometri", "total": 8, "correct": 7, "accuracy": 0.875, "mastery": 0.875},
            ],
            "limit": 3,
            "weakThreshold": 0.55,
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "Örüntüler" in body["weakTopics"]
    assert "Geometri" not in body["weakTopics"]


def test_questions_solve_endpoint():
    resp = client.post(
        "/questions/solve",
        json={
            "text": "Her adımda altıgen sayısı iki katına çıkar. 4. adımda kaç altıgen vardır?",
            "options": ["6", "8", "10", "12"],
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["correctAnswer"] == "8"


def test_questions_solve_endpoint_returns_unmatched_when_unsolvable():
    resp = client.post("/questions/solve", json={"text": "Alakasız bir metin.", "options": ["1", "2"]})
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is False
    assert body["data"] is None


def test_questions_parse_text_endpoint():
    resp = client.post(
        "/questions/parse-text",
        json={
            "ocrText": (
                "Bir sayi oruntusunde 3, 6, 9, 12, ... seklinde devam etmektedir. "
                "Siradaki terim kactir?\nA) 14\nB) 15\nC) 16\nD) 13\nCevap: B"
            )
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["correctAnswer"] == "15"


def test_questions_generate_from_pool_endpoint():
    resp = client.post(
        "/questions/generate-from-pool",
        json={"count": 3, "classLevel": "5", "difficulty": "Orta"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert len(body["data"]["questions"]) == 3


def test_missing_body_returns_validation_error():
    resp = client.post("/questions/parse-text", json={})
    assert resp.status_code == 422


def test_health_endpoint_stays_public_even_when_api_key_is_set(monkeypatch):
    # /health has no _check_api_key gate — Render's healthCheckPath must stay reachable unauthenticated.
    monkeypatch.setenv("ML_SERVICE_API_KEY", "secret123")
    reloaded = importlib.reload(main)
    try:
        gated_client = TestClient(reloaded.app)
        resp = gated_client.get("/health")
        assert resp.status_code == 200
    finally:
        monkeypatch.delenv("ML_SERVICE_API_KEY", raising=False)
        importlib.reload(main)


def test_api_key_gate_rejects_missing_or_wrong_key(monkeypatch):
    monkeypatch.setenv("ML_SERVICE_API_KEY", "secret123")
    reloaded = importlib.reload(main)
    try:
        gated_client = TestClient(reloaded.app)
        payload = {"text": "test", "options": ["1", "2"]}

        resp_no_key = gated_client.post("/questions/solve", json=payload)
        assert resp_no_key.status_code == 401

        resp_wrong_key = gated_client.post(
            "/questions/solve", json=payload, headers={"X-API-Key": "wrong"}
        )
        assert resp_wrong_key.status_code == 401

        resp_correct_key = gated_client.post(
            "/questions/solve", json=payload, headers={"X-API-Key": "secret123"}
        )
        assert resp_correct_key.status_code == 200
    finally:
        monkeypatch.delenv("ML_SERVICE_API_KEY", raising=False)
        importlib.reload(main)
