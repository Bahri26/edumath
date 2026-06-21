from services.question_solver import (
    solve_hexagon_count_pattern,
    solve_pattern_question,
    solve_square_count_pattern,
    solve_square_numbers_pattern,
    solve_triangular_numbers_pattern,
    solve_two_step_pattern,
)


def test_square_count_step_pattern():
    result = solve_square_count_pattern(
        "İlk üç adımı verilen karelerden oluşan şekil örüntüsünde 4. adımda kaç kare kullanılır?",
        ["6", "7", "9", "10"],
    )
    assert result is not None
    assert result.correct_answer == "7"
    assert result.solver_name == "square-count"


def test_hexagon_count():
    result = solve_hexagon_count_pattern(
        "Her adımda altıgen sayısı iki katına çıkar. 4. adımda kaç altıgen vardır?",
        ["6", "8", "10", "12"],
    )
    assert result is not None
    assert result.correct_answer == "8"
    assert result.solver_name == "hexagon-count"


def test_square_numbers():
    result = solve_square_numbers_pattern(
        "Aşağıdaki kare sayı dizisinde 4, 9, 16, ? sıradaki terim kaçtır?",
        ["20", "25", "30", "36"],
    )
    assert result is not None
    assert result.correct_answer == "25"
    assert result.solver_name == "square-numbers"


def test_triangular_numbers():
    result = solve_triangular_numbers_pattern(
        "Üçgensel sayı dizisi: 3, 6, 10, ?",
        ["12", "15", "16", "18"],
    )
    assert result is not None
    assert result.correct_answer == "15"
    assert result.solver_name == "triangular-numbers"


def test_two_step():
    result = solve_two_step_pattern(
        "İki adımlı kural: 5, 8, 6, 9, 7, ?",
        ["10", "12", "8", "11"],
    )
    assert result is not None
    assert result.correct_answer == "10"
    assert result.solver_name == "two-step"


def test_solve_pattern_question_integration():
    payload = {
        "text": "Mozaik tablosunda 8, 13, 18, 23 örüntüsünün 9. terimi kaçtır?",
        "options": ["48", "43", "53", "38"],
    }
    result = solve_pattern_question(payload)
    assert result is not None
    assert result["correctAnswer"] == "48"
