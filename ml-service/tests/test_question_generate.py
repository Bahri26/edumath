from services.question_generate import generate_questions_from_pool


def test_generate_respects_count_upper_bound():
    result = generate_questions_from_pool({"count": 999, "classLevel": "5"})
    assert len(result["questions"]) == 20


def test_generate_count_zero_clamps_to_minimum_not_default():
    # Python's `x or 5` treats 0 as falsy; count=0 must clamp to 1, not silently become 5.
    result = generate_questions_from_pool({"count": 0, "classLevel": "5"})
    assert len(result["questions"]) == 1


def test_generate_invalid_count_falls_back_to_default():
    result = generate_questions_from_pool({"count": "not-a-number", "classLevel": "5"})
    assert len(result["questions"]) == 5


def test_generate_elementary_pattern_produces_distinct_texts_at_moderate_count():
    # Previously the "Kolay" + grade<=2 repeat-pattern branch had only 4 possible
    # texts (fixed theme pairs, no numeric variation), so count=5 always collided.
    result = generate_questions_from_pool(
        {"count": 5, "classLevel": "2", "difficulty": "Kolay"}
    )
    texts = [q["text"] for q in result["questions"]]
    assert len(set(texts)) == 5
    for q in result["questions"]:
        assert len(q["options"]) == 4
        assert len(set(q["options"])) == 4
        assert q["correctAnswer"] in q["options"]


def test_generate_elementary_pattern_for_low_grade_without_pool():
    result = generate_questions_from_pool(
        {"count": 3, "classLevel": "3", "difficulty": "Kolay", "poolSamples": []}
    )
    questions = result["questions"]
    assert len(questions) == 3
    for q in questions:
        assert len(q["options"]) == 4
        assert q["correctAnswer"] in q["options"]
        assert q["classLevel"] == "3"
        assert q["difficulty"] == "Kolay"
        assert q["type"] == "multiple-choice"
        assert q["generatorMethod"] == "elementary-template"
    assert result["poolSampleCount"] == 0


def test_generate_arithmetic_template_for_higher_grade_without_pool():
    result = generate_questions_from_pool(
        {"count": 4, "classLevel": "7", "difficulty": "Orta", "poolSamples": []}
    )
    questions = result["questions"]
    assert len(questions) == 4
    texts = [q["text"] for q in questions]
    assert len(set(texts)) == len(texts)
    for q in questions:
        assert q["correctAnswer"] in q["options"]
        assert q["templateKey"] == "arithmetic-sequence"


def test_generate_pool_variant_uses_solver_validated_answer():
    pool = [
        {
            "text": "Her adımda altıgen sayısı iki katına çıkar. 4. adımda kaç altıgen vardır?",
            "options": ["6", "8", "10", "12"],
            "correctAnswer": "8",
            "solution": "eski çözüm",
            "topic": "Örüntüler",
            "difficulty": "Orta",
            "classLevel": "7",
        }
    ]
    result = generate_questions_from_pool(
        {
            "topic": "Örüntüler",
            "difficulty": "Orta",
            "count": 2,
            "classLevel": "7",
            "poolSamples": pool,
        }
    )
    assert result["poolSampleCount"] == 1
    for q in result["questions"]:
        assert q["generatorMethod"] == "pool-variant"
        assert q["source"] == "AI"
        assert q["correctAnswer"] in q["options"]
        # Solver-derived answer must stay consistent with the (rescaled) question text.
        assert "altıgen" in q["text"]


def test_generate_filters_out_too_advanced_pool_samples_for_low_grade():
    pool = [
        {
            "text": "Örüntüde n. adımdaki birim küp sayısını veren kural 2x+3 hangisidir?",
            "options": ["2x+3", "3x", "x+2", "4x"],
            "correctAnswer": "2x+3",
            "topic": "Cebir",
            "difficulty": "Zor",
            "classLevel": "3",
        }
    ]
    result = generate_questions_from_pool(
        {
            "topic": "",
            "difficulty": "Zor",
            "count": 2,
            "classLevel": "3",
            "poolSamples": pool,
        }
    )
    # The algebraic sample is above grade-3 level, so it must be filtered out entirely
    # and the generator should fall back to elementary templates instead.
    assert result["poolSampleCount"] == 0
    for q in result["questions"]:
        assert "2x" not in q["text"]
        assert q["generatorMethod"] == "elementary-template"
