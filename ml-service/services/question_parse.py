"""
OCR metninden soru + şık ayrıştırma (Tesseract çıktısı için).
"""

from __future__ import annotations

import re
from typing import Any

from .question_analyze import analyze_question, infer_difficulty, infer_topic
from .question_solver import solve_pattern_question


def clean_ocr_text(raw: str) -> str:
    text = str(raw or "").replace("\r", "\n")
    text = text.replace("|", "I").replace("¦", "I")
    text = re.sub(r"(\d)\s+(\d)", r"\1\2", text)
    text = re.sub(r"al-\s*tigen", "altıgen", text, flags=re.I)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def normalize_options(options: list[Any]) -> list[str]:
    trimmed = [str(v or "").strip() for v in options if str(v or "").strip()]
    if not trimmed:
        return ["", "", "", ""]
    padded = trimmed[:8]
    while len(padded) < 4:
        padded.append("")
    return padded[:4]


def parse_structured_question_text(content: str, defaults: dict[str, Any] | None = None) -> dict[str, Any]:
    defaults = defaults or {}
    normalized = clean_ocr_text(content)
    if not normalized:
        return {
            "text": "",
            "options": ["", "", "", ""],
            "correctAnswer": "",
            "solution": "",
            "topic": "",
            "difficulty": "Orta",
        }

    normalized = re.sub(
        r"([A-Da-d])\s*[\)\.\:]\s*",
        lambda m: f"\n{m.group(1).upper()}) ",
        normalized,
    )

    lines = [line.strip() for line in normalized.split("\n") if line.strip()]
    options: list[str | None] = [None] * 8
    question_lines: list[str] = []
    correct_answer = ""

    def push_option(letter: str, value: str) -> None:
        idx = "ABCDEFGH".find(letter.upper())
        if idx >= 0:
            options[idx] = str(value or "").strip()

    for line in lines:
        answer = re.match(
            r"^(?:Doğru\s*Cevap|Dogru\s*Cevap|Cevap|Answer)\s*[:=]\s*(.+)$",
            line,
            re.I,
        )
        if answer:
            ans = answer.group(1).strip()
            letter_m = re.match(r"^([A-D])$", ans, re.I) or re.match(r"^([A-D])[\)\.\:]", ans, re.I)
            if letter_m:
                idx = "ABCD".index(letter_m.group(1).upper())
                opt_list = normalize_options([o for o in options if o])
                if idx < len(opt_list) and opt_list[idx]:
                    correct_answer = opt_list[idx]
                else:
                    correct_answer = re.sub(r"^[A-D][\)\.\:\s]*", "", ans, flags=re.I).strip()
            else:
                correct_answer = ans
            continue

        marked = re.match(r"^\*?\s*([A-H])\s*[\)\.\:]\s*(.+)$", line, re.I)
        if marked:
            push_option(marked.group(1), marked.group(2))
            if line.startswith("*"):
                idx = "ABCDEFGH".index(marked.group(1).upper())
                opt_list = [o for o in options if o]
                if idx < len(opt_list):
                    correct_answer = opt_list[idx] or ""
            continue

        inline = list(
            re.finditer(r"([A-H])\s*[\)\.\:]\s*([^A-H]+?)(?=\s+[A-H]\s*[\)\.\:]|$)", line, re.I)
        )
        if inline:
            for m in inline:
                push_option(m.group(1), m.group(2))
            continue

        if not re.match(r"^[A-H]\s*[\)\.\:]", line, re.I):
            question_lines.append(line)

    normalized_options = normalize_options([o for o in options if o is not None and o != ""])
    if not correct_answer:
        tail = re.search(r"(?:Cevap|Doğru)\s*[:=]\s*([A-D])", normalized, re.I)
        if tail:
            idx = "ABCD".index(tail.group(1).upper())
            if idx < len(normalized_options) and normalized_options[idx]:
                correct_answer = normalized_options[idx]

    text = " ".join(question_lines).strip() or normalized.split("\nA)")[0].strip()
    topic = defaults.get("topic") or infer_topic(text)
    difficulty = defaults.get("difficulty") or infer_difficulty(text, len([o for o in normalized_options if o]))

    base = {
        "text": text,
        "questionText": text,
        "introText": defaults.get("introText") or "",
        "options": normalized_options,
        "correctAnswer": correct_answer,
        "solution": defaults.get("solution") or "",
        "topic": topic,
        "difficulty": difficulty,
        "ocrPreview": normalized[:2000],
    }

    if not base["correctAnswer"] or not base["solution"]:
        solved = solve_pattern_question(base)
        if solved:
            if not base["correctAnswer"]:
                base["correctAnswer"] = solved.get("correctAnswer", "")
            if not base["solution"]:
                base["solution"] = solved.get("solution", "")
            base["solverName"] = solved.get("solverName")

    analyzed = analyze_question(base)
    base["topic"] = base.get("topic") or analyzed.get("topic", "")
    base["difficulty"] = base.get("difficulty") or analyzed.get("difficulty", "Orta")
    base["analysisTags"] = analyzed.get("tags", [])
    return base


def enrich_question(payload: dict[str, Any]) -> dict[str, Any]:
    result = dict(payload)

    if (not result.get("text") and not result.get("questionText")) and payload.get("ocrText"):
        parsed = parse_structured_question_text(str(payload["ocrText"]), payload)
        result.update(parsed)

    analyzed = analyze_question(result)
    if not result.get("topic"):
        result["topic"] = analyzed.get("topic", "")
    if not result.get("difficulty"):
        result["difficulty"] = analyzed.get("difficulty", "Orta")
    result["analysisTags"] = analyzed.get("tags", [])
    result["engine"] = "edumath-local"

    has_answer = bool(str(result.get("correctAnswer") or "").strip())
    has_solution = bool(str(result.get("solution") or "").strip())

    if not has_answer or not has_solution:
        solved = solve_pattern_question(result)
        if solved:
            if not has_answer:
                result["correctAnswer"] = solved.get("correctAnswer", "")
            if not has_solution:
                result["solution"] = solved.get("solution", "")
            result["solverName"] = solved.get("solverName")
            result["correctIndex"] = solved.get("correctIndex")

    return result
