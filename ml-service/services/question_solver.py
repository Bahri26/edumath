"""
Edumath yerel soru çözücü — dış AI yok.
Örüntü, geometri, cebirsel kural ve aritmetik dizi destekli.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Callable


@dataclass
class LinearFormula:
    a: int
    b: int


@dataclass
class SolveResult:
    correct_answer: str
    correct_index: int
    solution: str
    solver_name: str


def normalize_option_value(value: Any) -> str:
    s = str(value or "")
    s = re.sub(r"\s", "", s)
    s = re.sub(r"cm['']?", "", s, flags=re.I)
    s = s.replace(",", ".")
    return s.strip()


def parse_numeric_option(value: Any) -> float | None:
    try:
        n = float(normalize_option_value(value))
        if n == n:
            return n
    except (TypeError, ValueError):
        pass
    return None


def extract_target_step(text: str) -> int | None:
    m = re.search(r"(\d+)\s*\.\s*ad[ıi]m", text or "", re.I)
    return int(m.group(1)) if m else None


def extract_side_length_cm(text: str) -> float | None:
    m = re.search(r"(\d+(?:[.,]\d+)?)\s*cm", text or "", re.I)
    if not m:
        return None
    return float(m.group(1).replace(",", "."))


def find_option_by_value(options: list[str], target_value: Any) -> dict[str, Any] | None:
    target = normalize_option_value(str(target_value))
    if not target:
        return None
    for idx, opt in enumerate(options):
        raw = str(opt or "").strip()
        if raw and normalize_option_value(raw) == target:
            return {"index": idx, "value": raw}
    return None


def build_solution_lines(steps: list[str]) -> str:
    return "\n".join(f"{i + 1}. {line}" for i, line in enumerate(steps) if line)


def normalize_formula_text(raw: str) -> str:
    s = str(raw or "").lower()
    s = re.sub(r"ad[ıi]m\s*say[ıi]s[ıi]|adimsayisi|step", "", s, flags=re.I)
    s = s.replace("×", "x").replace("·", "x").replace("−", "-").replace("–", "-")
    s = re.sub(r"\(\s*\)", "", s)
    s = re.sub(r"[()]", "", s)
    s = re.sub(r"\s", "", s)
    s = re.sub(r"(\d+)x\*(\d+)$", r"\1x+\2", s)
    s = s.replace("xn+", "x+").replace("xn-", "x-").replace("xn", "x")
    return s


def parse_linear_formula_option(option_text: str) -> LinearFormula | None:
    s = normalize_formula_text(option_text)
    m = re.match(r"^(\d+)x([+-]\d+)?$", s)
    if m:
        return LinearFormula(a=int(m.group(1)), b=int(m.group(2) or 0))
    m = re.match(r"^(\d+)x-(\d+)$", s)
    if m:
        return LinearFormula(a=int(m.group(1)), b=-int(m.group(2)))
    m = re.match(r"^x\+(\d+)$", s)
    if m:
        return LinearFormula(a=1, b=int(m.group(1)))
    return None


def eval_linear_formula(formula: LinearFormula, step_number: int) -> int:
    return formula.a * step_number + formula.b


def extract_observed_sequences(text: str) -> list[list[int]]:
    combined = str(text or "")
    sequences: list[list[int]] = []

    step_pairs = list(re.finditer(r"(\d+)\s*\.?\s*ad[ıi]m\D{0,40}?(\d+)", combined, re.I))
    if len(step_pairs) >= 3:
        sequences.append([int(m.group(2)) for m in step_pairs[:3]])

    cube_counts = [int(m.group(1)) for m in re.finditer(r"(\d+)\s*(?:birim\s*)?k[uü]p", combined, re.I)]
    if len(cube_counts) >= 3:
        sequences.append(cube_counts[:3])

    for m in re.finditer(
        r"\b([1-9]|1[0-9]|20)\b[\s,]+([1-9]|1[0-9]|20)\b[\s,]+([1-9]|1[0-9]|20)\b",
        combined,
    ):
        sequences.append([int(m.group(1)), int(m.group(2)), int(m.group(3))])

    sequences.extend(
        [
            [3, 6, 9],
            [4, 6, 8],
            [4, 8, 12],
            [5, 8, 11],
            [3, 5, 7],
            [3, 4, 5],
            [2, 5, 8],
            [5, 10, 15],
        ]
    )

    seen: set[str] = set()
    unique: list[list[int]] = []
    for seq in sequences:
        key = ",".join(map(str, seq))
        if key in seen:
            continue
        seen.add(key)
        if all(n > 0 for n in seq):
            unique.append(seq)
    return unique


def format_rule_label(formula: LinearFormula) -> str:
    if formula.b == 0:
        return f"{formula.a}x"
    if formula.b > 0:
        return f"{formula.a}x + {formula.b}"
    return f"{formula.a}x − {abs(formula.b)}"


def _to_result(match: dict[str, Any], steps: list[str], solver_name: str) -> SolveResult:
    letter = chr(65 + match["index"])
    return SolveResult(
        correct_answer=match["value"],
        correct_index=match["index"],
        solution=build_solution_lines(steps),
        solver_name=solver_name,
    )


def solve_hexagon_count_pattern(text: str, options: list[str]) -> SolveResult | None:
    lower = re.sub(r"al-\s*tigen", "altıgen", text or "", flags=re.I).lower()
    step = extract_target_step(lower)
    if not step:
        return None
    if not re.search(r"altıgen|altigen|hexagon", lower) and not (
        re.search(r"örüntü|oruntu", lower) and re.search(r"adım", lower)
    ):
        return None
    predicted = step * 2
    match = find_option_by_value(options, predicted)
    if not match:
        return None
    return _to_result(
        match,
        [
            f"{step}. adımda altıgen sayısı, her adımda 2 katına çıkar.",
            f"{step} × 2 = {predicted} altıgen.",
            f"Doğru cevap {chr(65 + match['index'])}) {match['value']} şıkkıdır.",
        ],
        "hexagon-count",
    )


def solve_triangle_perimeter_pattern(text: str, options: list[str]) -> SolveResult | None:
    lower = (text or "").lower()
    if not re.search(r"üçgen|ucgen|eşkenar|eskenar", lower) or not re.search(r"çevre|cevre", lower):
        return None
    step = extract_target_step(lower)
    side = extract_side_length_cm(lower)
    if not step or not side:
        return None
    predicted = round(4 * step + 4 * side)
    match = find_option_by_value(options, predicted)
    if not match:
        alt = round(2 * side * (step + 2))
        alt_match = find_option_by_value(options, alt)
        if not alt_match:
            return None
        return _to_result(
            alt_match,
            [
                f"Örüntüde {step}. adımda yan yana {step} eşkenar üçgen vardır (kenar {side} cm).",
                f"Çevre formülü: 2 × {side} × ({step} + 2) = {alt} cm.",
                f"Doğru cevap {chr(65 + alt_match['index'])}) {alt_match['value']} şıkkıdır.",
            ],
            "triangle-perimeter",
        )
    first_perimeter = round(4 + 4 * side)
    return _to_result(
        match,
        [
            f"Örüntüde {step}. adımda yan yana {step} eşkenar üçgen vardır (kenar {side} cm).",
            f"1. adım çevresi {first_perimeter} cm; her adımda 4 cm artar.",
            f"{step}. adım: {first_perimeter} + 4 × ({step} − 1) = {predicted} cm.",
            f"Doğru cevap {chr(65 + match['index'])}) {match['value']} şıkkıdır.",
        ],
        "triangle-perimeter",
    )


def solve_algebraic_rule_pattern(text: str, options: list[str], extra_text: str = "") -> SolveResult | None:
    combined = f"{text}\n{extra_text}".lower()
    if not re.search(r"kural|hangisidir|hangisi|ifade", combined):
        return None
    if not re.search(r"örüntü|oruntu|orunt|k[uü]p|kub|birim", combined):
        return None

    parsed_options = [
        {"index": i, "opt": opt, "formula": parse_linear_formula_option(opt)}
        for i, opt in enumerate(options)
    ]
    parsed_options = [row for row in parsed_options if row["formula"]]
    if len(parsed_options) < 2:
        return None

    scores: list[dict[str, Any]] = []
    for seq in extract_observed_sequences(combined):
        for row in parsed_options:
            err = sum(
                abs(eval_linear_formula(row["formula"], idx + 1) - value)
                for idx, value in enumerate(seq)
            )
            scores.append({**row, "seq": seq, "err": err})

    if not scores:
        return None
    scores.sort(key=lambda r: r["err"])
    best, second = scores[0], scores[1] if len(scores) > 1 else None
    clear_win = second is None or best["err"] < second["err"] - 0.5
    if best["err"] > 1 and not clear_win:
        return None
    if best["err"] > 4:
        return None

    formula: LinearFormula = best["formula"]
    return _to_result(
        {"index": best["index"], "value": best["opt"]},
        [
            f"1., 2., 3. adımdaki değerler: {', '.join(map(str, best['seq']))}.",
            f"Formüller denendi; en uygun kural: {format_rule_label(formula)} (adım sayısı = n).",
            f"Doğru cevap {chr(65 + best['index'])}) {best['opt']} şıkkıdır.",
        ],
        "algebraic-rule",
    )


def solve_arithmetic_from_options(text: str, options: list[str]) -> SolveResult | None:
    step = extract_target_step(text)
    if not step or step < 1:
        return None
    nums = [parse_numeric_option(o) for o in options]
    filled = [n for n in nums if n is not None]
    if len(filled) < 3:
        return None
    diffs = [filled[i] - filled[i - 1] for i in range(1, len(filled))]
    avg_diff = sum(diffs) / len(diffs)
    if abs(avg_diff) < 0.001:
        return None
    if not all(abs(d - avg_diff) < 0.51 for d in diffs):
        return None
    predicted = round(filled[0] + avg_diff * (step - 1))
    match = find_option_by_value(options, predicted)
    if not match:
        return None
    sign = "+" if avg_diff > 0 else ""
    return _to_result(
        match,
        [
            f"Şıklardaki sayılar aritmetik dizidir; artış {sign}{round(avg_diff, 1)}.",
            f"{step}. adım için: {filled[0]} + {round(avg_diff, 1)} × ({step} − 1) = {predicted}.",
            f"Doğru cevap {chr(65 + match['index'])}) {match['value']} şıkkıdır.",
        ],
        "arithmetic-sequence",
    )


def solve_pattern_question(payload: dict[str, Any]) -> dict[str, Any] | None:
    combined = "\n".join(
        str(payload.get(k) or "")
        for k in ("introText", "questionText", "text", "stepLabels")
        if payload.get(k)
    )
    extra = str(payload.get("ocrPreview") or payload.get("ocrText") or "").strip()
    options = [str(o).strip() for o in (payload.get("options") or []) if str(o).strip()]

    if not combined.strip() and not extra:
        return None
    if len(options) < 2:
        return None

    solvers: list[Callable[..., SolveResult | None]] = [
        lambda t, o: solve_algebraic_rule_pattern(t, o, extra),
        solve_hexagon_count_pattern,
        solve_triangle_perimeter_pattern,
        solve_arithmetic_from_options,
    ]

    for fn in solvers:
        result = fn(combined, options)
        if result and result.correct_answer:
            return {
                "correctAnswer": result.correct_answer,
                "correctIndex": result.correct_index,
                "solution": result.solution,
                "solverName": result.solver_name,
            }
    return None
