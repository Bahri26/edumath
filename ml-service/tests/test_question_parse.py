from services.question_parse import (
    clean_ocr_text,
    enrich_question,
    normalize_options,
    parse_structured_question_text,
)


def test_clean_ocr_text_normalizes_ocr_artifacts():
    raw = "2  0\n\n\n\nal-tigen ¦ test |"
    cleaned = clean_ocr_text(raw)
    assert "20" in cleaned
    assert "altıgen" in cleaned
    assert "\n\n\n" not in cleaned
    assert "¦" not in cleaned and "|" not in cleaned


def test_normalize_options_pads_and_truncates():
    assert normalize_options([]) == ["", "", "", ""]
    assert normalize_options(["A", "B"]) == ["A", "B", "", ""]
    assert normalize_options(["A", "B", "C", "D", "E", "F"]) == ["A", "B", "C", "D"]


def test_parse_structured_question_text_empty_input_returns_defaults():
    result = parse_structured_question_text("")
    assert result == {
        "text": "",
        "options": ["", "", "", ""],
        "correctAnswer": "",
        "solution": "",
        "topic": "",
        "difficulty": "Orta",
    }


def test_parse_structured_question_text_extracts_options_and_answer():
    text = (
        "Bir sayi oruntusunde 3, 6, 9, 12, ... seklinde devam etmektedir. "
        "Siradaki terim kactir?\n"
        "A) 14\nB) 15\nC) 16\nD) 13\nCevap: B"
    )
    result = parse_structured_question_text(text)
    assert result["options"] == ["14", "15", "16", "13"]
    assert result["correctAnswer"] == "15"
    assert result["difficulty"] == "Orta"
    assert result["topic"]


def test_parse_structured_question_text_falls_back_to_solver_without_answer_line():
    text = (
        "Her adımda altıgen sayısı iki katına çıkar.\n"
        "4. adımda kaç altıgen vardır?\n"
        "A) 6\nB) 8\nC) 10\nD) 12"
    )
    result = parse_structured_question_text(text)
    assert result["correctAnswer"] == "8"
    assert result.get("solverName") == "hexagon-count"
    assert result["solution"]


def test_enrich_question_fills_missing_fields_from_ocr_text():
    payload = {"ocrText": "Her adımda altıgen sayısı iki katına çıkar.\n4. adımda kaç altıgen vardır?\nA) 6\nB) 8\nC) 10\nD) 12"}
    result = enrich_question(payload)
    assert result["engine"] == "edumath-local"
    assert result["correctAnswer"] == "8"
    assert result["topic"]
    assert result["difficulty"]
    assert "analysisTags" in result


def test_enrich_question_preserves_existing_answer_and_skips_solver():
    payload = {
        "text": "Zaten cevaplı bir soru metni burada.",
        "options": ["1", "2", "3", "4"],
        "correctAnswer": "2",
        "solution": "Zaten var olan çözüm metni.",
    }
    result = enrich_question(payload)
    assert result["correctAnswer"] == "2"
    assert result["solution"] == "Zaten var olan çözüm metni."
    assert "solverName" not in result
