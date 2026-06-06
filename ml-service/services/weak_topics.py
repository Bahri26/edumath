"""
Konu bazlı zayıf alan skorlama — backend studentAnalyticsService ile uyumlu.
Girdi: konu istatistikleri listesi (accuracy, mastery, deneme sayısı vb.)
"""

from __future__ import annotations

import os
from typing import Any

import numpy as np

DEFAULT_WEAK_THRESHOLD = float(os.getenv("ML_WEAK_TOPIC_THRESHOLD", "0.55"))


def _safe_float(value: Any, fallback: float = 0.0) -> float:
    try:
        parsed = float(value)
        if np.isfinite(parsed):
            return parsed
    except (TypeError, ValueError):
        pass
    return fallback


def score_topic_entries(
    entries: list[dict[str, Any]],
    *,
    weak_threshold: float | None = None,
) -> list[dict[str, Any]]:
    """
    Her konu için mastery / distanceFromIdeal / priorityScore hesaplar.
    """
    threshold = weak_threshold if weak_threshold is not None else DEFAULT_WEAK_THRESHOLD
    if not entries:
        return []

    totals = [_safe_float(e.get("total")) for e in entries]
    max_total = max(totals) if totals else 1.0
    max_total = max(max_total, 1.0)

    scored: list[dict[str, Any]] = []
    for entry, total in zip(entries, totals):
        accuracy = _safe_float(entry.get("accuracy"))
        if accuracy <= 0 and total > 0:
            correct = _safe_float(entry.get("correct"))
            accuracy = correct / total if total else 0.0

        mastery = _safe_float(entry.get("mastery"), accuracy)
        volume_norm = min(1.0, total / max_total)
        distance = max(0.0, 1.0 - mastery)
        priority = distance * (0.6 + 0.4 * volume_norm)

        row = dict(entry)
        row.update(
            {
                "accuracy": round(accuracy, 4),
                "mastery": round(mastery, 4),
                "distanceFromIdeal": round(distance, 4),
                "priorityScore": round(priority, 4),
                "isWeak": mastery < threshold,
            }
        )
        scored.append(row)

    return scored


def rank_weak_topics(
    entries: list[dict[str, Any]],
    *,
    limit: int = 5,
    weak_threshold: float | None = None,
) -> dict[str, Any]:
    """
    Zayıf konuları öncelik skoruna göre sıralar.
    """
    scored = score_topic_entries(entries, weak_threshold=weak_threshold)
    weak = [row for row in scored if row.get("isWeak")]
    weak.sort(key=lambda r: (-r.get("priorityScore", 0), r.get("topic", "")))

    return {
        "weakTopics": [r.get("topic", "Genel") for r in weak[:limit]],
        "topics": scored,
        "threshold": weak_threshold if weak_threshold is not None else DEFAULT_WEAK_THRESHOLD,
        "count": len(weak),
    }
