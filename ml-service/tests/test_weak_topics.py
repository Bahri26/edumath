from services.weak_topics import rank_weak_topics, score_topic_entries


def test_weak_topic_threshold():
    entries = [
        {"topic": "Örüntüler", "total": 10, "correct": 4, "accuracy": 0.4, "mastery": 0.4},
        {"topic": "Geometri", "total": 8, "correct": 7, "accuracy": 0.875, "mastery": 0.875},
    ]
    result = rank_weak_topics(entries, limit=3, weak_threshold=0.55)
    assert "Örüntüler" in result["weakTopics"]
    assert "Geometri" not in result["weakTopics"]
    assert result["threshold"] == 0.55


def test_priority_score_ordering():
    entries = [
        {"topic": "A", "total": 10, "correct": 2, "accuracy": 0.2, "mastery": 0.2},
        {"topic": "B", "total": 10, "correct": 4, "accuracy": 0.4, "mastery": 0.4},
    ]
    scored = score_topic_entries(entries, weak_threshold=0.55)
    weak = [r for r in scored if r["isWeak"]]
    assert len(weak) == 2
    assert weak[0]["priorityScore"] >= weak[1]["priorityScore"]
