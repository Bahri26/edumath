"""
Soru metni analizi — konu, zorluk, MEB alt konu (kural tabanlı, dış AI yok).
"""

from __future__ import annotations

import re
from typing import Any

from .pattern_topics import LEARNING_OUTCOME_BY_LABEL, PATTERN_TOPIC_LABELS


def infer_topic(text: str) -> str:
    sub = infer_pattern_subtopic(text)
    if sub:
        return sub
    t = (text or "").lower()
    if re.search(r"geometri|üçgen|açı|alan|çevre", t):
        return "Geometri"
    if re.search(r"denklem|eşitlik|x\s*=|bilinmeyen", t):
        return "Cebir"
    if re.search(r"kesir|ondalık|yüzde|%", t):
        return "Sayılar"
    if re.search(r"olasılık|zar|kart", t):
        return "Olasılık"
    return ""


def infer_pattern_subtopic(text: str) -> str:
    """MEB örüntü alt konu etiketi — backend patternTopics.js ile uyumlu."""
    t = (text or "").lower()
    if re.search(r"eşleştir|eslestir|sınıfla|sinifla|hangi\s*tür", t):
        return PATTERN_TOPIC_LABELS["MATCHING"]
    if re.search(r"işlem\s*sıras|islem\s*sirasi|ad[ıi]mlar[ıi]\s*sırala|sıralama\s*yap", t):
        return PATTERN_TOPIC_LABELS["SEQUENCE"]
    if re.search(r"kare\s*say|1,\s*4,\s*9|n[\^²2]\s*=|n\s*\*\s*n", t):
        return PATTERN_TOPIC_LABELS["SQUARES"]
    if re.search(r"üçgensel|ucgensel|triangular|t_n|n\(n\+1\)", t):
        return PATTERN_TOPIC_LABELS["TRIANGULAR"]
    if re.search(r"iki\s*ad[ıi]ml[ıi]|karma\s*kural|art\s*arda\s*\+", t):
        return PATTERN_TOPIC_LABELS["RULE"]
    if re.search(r"alt[ıi]gen|altigen|hexagon|▲|●|◆|şekil\s*örünt|sekil\s*orunt", t):
        return PATTERN_TOPIC_LABELS["GEOMETRIC"]
    if re.search(r"üçgen|ucgen|eşkenar|eskenar", t) and re.search(r"çevre|cevre|dizil", t):
        return PATTERN_TOPIC_LABELS["GEOMETRIC"]
    if re.search(r"kural|hangisidir|hangisi|ifade", t) and re.search(r"örüntü|oruntu|k[uü]p|birim", t):
        return PATTERN_TOPIC_LABELS["RULE"]
    if re.search(r"terim|dizi|oruntu|örüntü|art[ıi]|azal", t):
        return PATTERN_TOPIC_LABELS["ARITHMETIC"]
    if re.search(r"örüntü|oruntu|dizi", t):
        return PATTERN_TOPIC_LABELS["ARITHMETIC"]
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
    explicit_topic = str(payload.get("topic") or "").strip()
    pattern_sub = infer_pattern_subtopic(combined)
    topic = explicit_topic or pattern_sub or infer_topic(combined)
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
    if pattern_sub == PATTERN_TOPIC_LABELS["SQUARES"]:
        tags.append("square-numbers")
    if pattern_sub == PATTERN_TOPIC_LABELS["TRIANGULAR"]:
        tags.append("triangular-numbers")
    if pattern_sub == PATTERN_TOPIC_LABELS["RULE"]:
        tags.append("two-step")

    learning_outcome = LEARNING_OUTCOME_BY_LABEL.get(topic, "")

    return {
        "topic": topic,
        "patternSubtopic": pattern_sub or None,
        "difficulty": difficulty,
        "tags": tags,
        "learningOutcome": learning_outcome,
        "questionType": "multiple-choice",
        "engine": "edumath-local",
    }
