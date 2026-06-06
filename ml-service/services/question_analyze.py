"""
Soru metni analizi — konu, zorluk (kural tabanlı, dış AI yok).
"""

from __future__ import annotations

import re
from typing import Any


def infer_topic(text: str) -> str:
    t = (text or "").lower()
    if re.search(r"örüntü|oruntu|dizi|sıra\s*:", t):
        return "Örüntüler"
    if re.search(r"geometri|üçgen|açı|alan|çevre", t):
        return "Geometri"
    if re.search(r"denklem|eşitlik|x\s*=|bilinmeyen", t):
        return "Cebir"
    if re.search(r"kesir|ondalık|yüzde|%", t):
        return "Sayılar"
    if re.search(r"olasılık|zar|kart", t):
        return "Olasılık"
    if re.search(r"k[uü]p|birim", t):
        return "Örüntüler"
    return ""


def infer_difficulty(text: str, option_count: int = 4) -> str:
    length = len(text or "")
    if length > 220 or option_count > 4:
        return "Zor"
    if length < 80:
        return "Kolay"
    return "Orta"


def analyze_question(payload: dict[str, Any]) -> dict[str, Any]:
    combined = "\n".join(
        str(payload.get(k) or "")
        for k in ("introText", "questionText", "text")
        if payload.get(k)
    )
    options = [str(o).strip() for o in (payload.get("options") or []) if str(o).strip()]
    topic = str(payload.get("topic") or "").strip() or infer_topic(combined)
    difficulty = str(payload.get("difficulty") or "").strip() or infer_difficulty(combined, len(options))

    tags: list[str] = []
    lower = combined.lower()
    if re.search(r"örüntü|oruntu", lower):
        tags.append("pattern")
    if re.search(r"çevre|cevre", lower):
        tags.append("perimeter")
    if re.search(r"kural", lower):
        tags.append("rule-finding")
    if re.search(r"altıgen|altigen", lower):
        tags.append("hexagon")
    if re.search(r"üçgen|ucgen", lower):
        tags.append("triangle")

    return {
        "topic": topic,
        "difficulty": difficulty,
        "tags": tags,
        "questionType": "multiple-choice",
        "engine": "edumath-local",
    }
