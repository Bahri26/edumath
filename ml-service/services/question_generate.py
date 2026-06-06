"""
Soru havuzundan esinlenerek YENİ sorular üretir (birebir kopya yok).
Dış AI yok — örüntü şablonları + havuz sorusu varyasyonu.
"""

from __future__ import annotations

import hashlib
import random
import re
from typing import Any

from .question_analyze import infer_difficulty, infer_topic
from .question_solver import solve_pattern_question

CONTEXT_THEMES = [
    ("boncuk", "renkli boncuklar", "boncuk dizisi"),
    ("kutu", "karton kutular", "kutu dizilimi"),
    ("mozaik", "mozaik parçaları", "mozaik tablosu"),
    ("kitap", "kitap rafları", "kütüphane rafları"),
    ("kare", "kare fayanslar", "fayans deseni"),
    ("top", "renkli toplar", "top sırası"),
    ("çiçek", "çiçek saksıları", "bahçe düzeni"),
    ("blok", "ahşap bloklar", "blok kulesi"),
]

MEB_REF = "MEB Matematik Öğretim Programı (2018) — öğretmen havuzu stiline uyumlu yerel üretim"


def _seed_for(key: str) -> random.Random:
    digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return random.Random(int(digest[:16], 16))


def _pick_theme(rng: random.Random) -> tuple[str, str, str]:
    return rng.choice(CONTEXT_THEMES)


def _replace_numbers(text: str, rng: random.Random, scale: float | None = None) -> str:
    if not text:
        return text

    def repl(m: re.Match[str]) -> str:
        raw = m.group(0).replace(",", ".")
        try:
            val = float(raw)
        except ValueError:
            return m.group(0)
        if val == int(val) and abs(val) < 1000:
            if scale is not None:
                new_val = max(1, int(round(val * scale)))
            else:
                delta = rng.randint(-3, 5)
                new_val = max(1, int(val) + delta)
            return str(new_val)
        return m.group(0)

    return re.sub(r"-?\d+(?:[.,]\d+)?", repl, text)


def _classify_sample(text: str) -> str:
    t = (text or "").lower()
    if re.search(r"alt[ıi]gen|altigen", t) and re.search(r"ad[ıi]m", t):
        return "hexagon"
    if re.search(r"üçgen|ucgen|eşkenar|eskenar", t) and re.search(r"çevre|cevre", t):
        return "triangle_perimeter"
    if re.search(r"kural|hangisi|ifade", t) and re.search(r"örüntü|oruntu|k[uü]p|birim", t):
        return "algebraic_rule"
    if re.search(r"terim|dizi|oruntu|örüntü|art[ıi]", t):
        return "arithmetic"
    return "generic"


def _difficulty_params(difficulty: str) -> tuple[int, int]:
    d = (difficulty or "Orta").lower()
    if d.startswith("kol"):
        return (2, 6)
    if d.startswith("zor"):
        return (8, 18)
    return (4, 12)


def _build_solution_lines(lines: list[str]) -> str:
    return "\n".join(f"{i + 1}. {line}" for i, line in enumerate(lines if lines else []))


def _generate_hexagon(step: int, theme: tuple[str, str, str], difficulty: str) -> dict[str, Any]:
    _, context, _ = theme
    predicted = step * 2
    opts = sorted({predicted, predicted + 2, max(2, predicted - 2), predicted + 4})
    while len(opts) < 4:
        opts.append(opts[-1] + 2)
    opts = opts[:4]
    correct = str(predicted)
    if correct not in opts:
        opts[0] = correct
    letter_idx = opts.index(int(correct) if correct.isdigit() else predicted)
    return {
        "text": f"{context.capitalize()} örüntüsünde her adımda altıgen sayısı iki katına çıkmaktadır. Buna göre {step}. adımda kaç altıgen vardır?",
        "options": [str(o) for o in opts],
        "correctAnswer": correct,
        "solution": _build_solution_lines([
            f"Her adımda altıgen sayısı 2 katına çıkar.",
            f"{step}. adım: {step} × 2 = {predicted} altıgen.",
            f"Doğru cevap {chr(65 + letter_idx)}) {correct} şıkkıdır.",
        ]),
        "learningOutcome": "Örüntüdeki çarpan kuralını kullanarak istenen adımdaki değeri bulur.",
        "templateKey": "hexagon-pattern",
    }


def _generate_triangle_perimeter(step: int, side: int, theme: tuple[str, str, str]) -> dict[str, Any]:
    _, context, _ = theme
    predicted = 4 * step + 4 * side
    opts = [predicted, predicted + 4, max(4, predicted - 4), predicted + 8]
    correct = str(predicted)
    opts = [str(o) for o in sorted(set(opts))][:4]
    if correct not in opts:
        opts[0] = correct
    idx = opts.index(correct)
    return {
        "text": f"Kenar uzunluğu {side} cm olan eşkenar üçgenler {context} ile yan yana diziliyor. {step}. adımdaki şeklin çevresi kaç cm'dir?",
        "options": opts,
        "correctAnswer": correct,
        "solution": _build_solution_lines([
            f"{step}. adımda yan yana {step} eşkenar üçgen vardır (kenar {side} cm).",
            f"Çevre: 4 × {step} + 4 × {side} = {predicted} cm.",
            f"Doğru cevap {chr(65 + idx)}) {correct} şıkkıdır.",
        ]),
        "learningOutcome": "Geometrik örüntüde çevre ile adım sayısı arasındaki ilişkiyi kurar.",
        "templateKey": "triangle-perimeter",
    }


def _generate_arithmetic(difficulty: str, theme: tuple[str, str, str], rng: random.Random) -> dict[str, Any]:
    _, context, _ = theme
    lo, hi = _difficulty_params(difficulty)
    first = rng.randint(lo, hi)
    diff = rng.choice([2, 3, 4, 5]) if difficulty != "Zor" else rng.randint(4, 9)
    seq = [first + diff * i for i in range(4)]
    ask_step = rng.randint(5, 9) if difficulty == "Zor" else rng.randint(4, 7)
    predicted = first + diff * (ask_step - 1)
    opts = sorted({predicted, predicted + diff, predicted - diff, predicted + 2 * diff})
    opts = [str(o) for o in opts[:4]]
    correct = str(predicted)
    if correct not in opts:
        opts[0] = correct
    idx = opts.index(correct)
    seq_str = ", ".join(str(x) for x in seq)
    return {
        "text": f"{context.capitalize()} tablosunda {seq_str}, ... örüntüsü devam etmektedir. Buna göre {ask_step}. terim kaçtır?",
        "options": opts,
        "correctAnswer": correct,
        "solution": _build_solution_lines([
            f"Terimler arası fark sabit: +{diff}.",
            f"{ask_step}. terim: {first} + {diff} × ({ask_step} − 1) = {predicted}.",
            f"Doğru cevap {chr(65 + idx)}) {correct} şıkkıdır.",
        ]),
        "learningOutcome": "Aritmetik dizide istenen terimi hesaplar.",
        "templateKey": "arithmetic-sequence",
    }


def _generate_algebraic_rule(theme: tuple[str, str, str], rng: random.Random) -> dict[str, Any]:
    _, context, _ = theme
    multiplier = rng.choice([2, 3, 4])
    seq = [multiplier * n for n in (1, 2, 3)]
    options = ["4x", "2x+2", f"x+{multiplier}", f"{multiplier}x"]
    correct = f"{multiplier}x"
    idx = options.index(correct)
    return {
        "text": f"{context.capitalize()} örüntüsünde 1., 2. ve 3. adımlardaki birim küp sayıları sırasıyla {seq[0]}, {seq[1]} ve {seq[2]}'dir. Bu örüntüyü veren kural hangisidir?",
        "options": options,
        "correctAnswer": correct,
        "solution": _build_solution_lines([
            f"Adım değerleri: {', '.join(str(v) for v in seq)}.",
            f"Her adımda değer {multiplier} ile çarpılıyor → kural {multiplier}x (n = adım sayısı).",
            f"Doğru cevap {chr(65 + idx)}) {correct} şıkkıdır.",
        ]),
        "learningOutcome": "Cebirsel kuralı örüntü verilerinden çıkarır.",
        "templateKey": "algebraic-rule",
        "ocrPreview": f"1. adım {seq[0]} birim küp 2. adım {seq[1]} birim küp 3. adım {seq[2]} birim küp",
    }


def _variant_from_sample(
    sample: dict[str, Any],
    params: dict[str, Any],
    index: int,
) -> dict[str, Any] | None:
    text = str(sample.get("text") or "").strip()
    if not text:
        return None

    key = f"{params.get('topic')}-{params.get('classLevel')}-{index}-{text[:40]}"
    rng = _seed_for(key)
    theme = _pick_theme(rng)
    scale = rng.uniform(0.85, 1.25)

    new_text = _replace_numbers(text, rng, scale)
    old_opts = [str(o).strip() for o in (sample.get("options") or []) if str(o).strip()]
    new_opts = [_replace_numbers(o, rng, scale) for o in old_opts[:4]]
    while len(new_opts) < 4:
        new_opts.append("")

    payload = {
        "text": new_text,
        "options": new_opts,
        "topic": params.get("topic") or sample.get("topic") or "",
        "difficulty": params.get("difficulty") or sample.get("difficulty") or "Orta",
        "classLevel": params.get("classLevel") or sample.get("classLevel") or "",
        "ocrPreview": str(sample.get("ocrPreview") or sample.get("text") or "")[:500],
    }

    solved = solve_pattern_question(payload)
    correct = str(sample.get("correctAnswer") or "").strip()
    solution = str(sample.get("solution") or "").strip()

    if solved:
        correct = solved.get("correctAnswer") or correct
        solution = solved.get("solution") or solution
        ci = solved.get("correctIndex")
        if ci is not None and 0 <= ci < len(new_opts):
            correct = new_opts[ci] or correct
    elif correct:
        correct = _replace_numbers(correct, rng, scale)
        if solution:
            solution = _replace_numbers(solution, rng, scale)

    if not correct or len([o for o in new_opts if o]) < 2:
        return None

    return {
        "text": new_text,
        "options": new_opts[:4],
        "correctAnswer": correct,
        "solution": solution or f"Doğru cevap: {correct}. Adımları deftere yazarak kontrol edin.",
        "learningOutcome": str(sample.get("learningOutcome") or "").strip(),
        "mebReference": MEB_REF,
        "topic": payload["topic"] or infer_topic(new_text),
        "difficulty": payload["difficulty"],
        "classLevel": payload["classLevel"],
        "source": "AI",
        "generatorMethod": "pool-variant",
    }


def _template_question(
    kind: str,
    params: dict[str, Any],
    index: int,
) -> dict[str, Any]:
    rng = _seed_for(f"tpl-{kind}-{params.get('topic')}-{index}")
    theme = _pick_theme(rng)
    difficulty = str(params.get("difficulty") or "Orta")
    lo, hi = _difficulty_params(difficulty)
    step = rng.randint(max(3, lo), hi)

    if kind == "hexagon":
        base = _generate_hexagon(step, theme, difficulty)
    elif kind == "triangle_perimeter":
        side = rng.randint(2, 6)
        base = _generate_triangle_perimeter(step, side, theme)
    elif kind == "algebraic_rule":
        base = _generate_algebraic_rule(theme, rng)
    elif kind == "arithmetic":
        base = _generate_arithmetic(difficulty, theme, rng)
    else:
        base = _generate_arithmetic(difficulty, theme, rng)

    topic = str(params.get("topic") or base.get("topic") or infer_topic(base["text"]))
    return {
        **base,
        "topic": topic,
        "difficulty": difficulty,
        "classLevel": params.get("classLevel") or "",
        "subject": params.get("subject") or "Matematik",
        "mebReference": MEB_REF,
        "source": "AI",
        "type": "multiple-choice",
        "generatorMethod": "template",
    }


def generate_questions_from_pool(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Havuz örneklerinden yeni sorular üret.
    poolSamples: [{ text, options, correctAnswer, solution, topic, ... }]
    """
    count = min(20, max(1, int(payload.get("count") or 5)))
    params = {
        "topic": str(payload.get("topic") or "").strip(),
        "difficulty": str(payload.get("difficulty") or "Orta").strip(),
        "classLevel": str(payload.get("classLevel") or "").strip(),
        "subject": str(payload.get("subject") or "Matematik").strip(),
    }
    samples = [s for s in (payload.get("poolSamples") or []) if str(s.get("text") or "").strip()]
    topic_lower = params["topic"].lower()

    default_kind = "arithmetic"
    if "örüntü" in topic_lower or "oruntu" in topic_lower:
        default_kind = "arithmetic"
    elif "geometri" in topic_lower:
        default_kind = "triangle_perimeter"

    questions: list[dict[str, Any]] = []
    seen_text: set[str] = set()

    for i in range(count):
        q: dict[str, Any] | None = None
        if samples:
            sample = samples[i % len(samples)]
            kind = _classify_sample(str(sample.get("text") or ""))
            if kind in ("hexagon", "triangle_perimeter", "algebraic_rule", "arithmetic"):
                q = _template_question(kind, params, i)
            else:
                q = _variant_from_sample(sample, params, i)

        if not q:
            q = _template_question(default_kind, params, i)

        text_key = (q.get("text") or "")[:120].lower()
        if text_key in seen_text:
            q = _template_question(default_kind, params, i + count)
            text_key = (q.get("text") or "")[:120].lower()
        seen_text.add(text_key)

        q["subject"] = params["subject"]
        q["classLevel"] = params["classLevel"]
        q["type"] = "multiple-choice"
        if not q.get("learningOutcome"):
            q["learningOutcome"] = "Havuz stiline uygun yeni soruyu çözer."
        questions.append(q)

    pool_used = len(samples)
    hint = (
        f"Havuzdaki {pool_used} örnekten esinlenilerek {len(questions)} yeni soru üretildi."
        if pool_used
        else f"Havuzda örnek yok; {len(questions)} soru yerel şablonlarla üretildi."
    )

    return {
        "questions": questions,
        "generator": "edumath-local",
        "poolSampleCount": pool_used,
        "hint": hint,
    }
