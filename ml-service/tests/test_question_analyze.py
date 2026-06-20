from services.question_analyze import analyze_question, infer_pattern_subtopic
from services.pattern_topics import PATTERN_TOPIC_LABELS


def test_infer_square_subtopic():
    label = infer_pattern_subtopic("Bu dizi kare sayı örüntüsüdür: 1, 4, 9, 16")
    assert label == PATTERN_TOPIC_LABELS["SQUARES"]


def test_infer_triangular_subtopic():
    label = infer_pattern_subtopic("Üçgensel sayı dizisi T(n) = n(n+1)/2")
    assert label == PATTERN_TOPIC_LABELS["TRIANGULAR"]


def test_analyze_question_returns_pattern_subtopic():
    data = analyze_question(
        {
            "text": "İki adımlı kural ile 5, 8, 6, 9, 7, ? örüntüsünde eksik sayı kaçtır?",
            "options": ["10", "11", "12", "9"],
        }
    )
    assert data["patternSubtopic"] == PATTERN_TOPIC_LABELS["RULE"]
    assert data["topic"] == PATTERN_TOPIC_LABELS["RULE"]
    assert "two-step" in data["tags"]
