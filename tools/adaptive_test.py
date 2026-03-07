# Adaptif Test Algoritması (Basit Kural Tabanlı Örnek)
# Öğrencinin önceki cevaplarına göre soru zorluğu ayarlanır.

import random

# Örnek soru havuzu (her biri farklı zorlukta)
questions = [
    {'id': 1, 'topic': 'Algebra', 'difficulty': 1},
    {'id': 2, 'topic': 'Algebra', 'difficulty': 2},
    {'id': 3, 'topic': 'Algebra', 'difficulty': 3},
    {'id': 4, 'topic': 'Geometry', 'difficulty': 1},
    {'id': 5, 'topic': 'Geometry', 'difficulty': 2},
    {'id': 6, 'topic': 'Geometry', 'difficulty': 3},
]

# Öğrencinin cevap geçmişi (örnek)
student_answers = [
    {'question_id': 1, 'correct': True},
    {'question_id': 2, 'correct': True},
    {'question_id': 3, 'correct': False},
]

def next_question(student_answers, topic):
    # Son cevap doğruysa zorluk artır, yanlışsa azalt
    last = next((a for a in reversed(student_answers) if any(q['id'] == a['question_id'] and q['topic'] == topic for q in questions)), None)
    if last is None:
        return random.choice([q for q in questions if q['topic'] == topic and q['difficulty'] == 1])
    last_q = next(q for q in questions if q['id'] == last['question_id'])
    next_diff = last_q['difficulty'] + (1 if last['correct'] else -1)
    next_diff = max(1, min(3, next_diff))
    candidates = [q for q in questions if q['topic'] == topic and q['difficulty'] == next_diff]
    return random.choice(candidates) if candidates else None

# Örnek kullanım
print(next_question(student_answers, 'Algebra'))

# Gelişmiş adaptif testler için: IRT, Bayesian Knowledge Tracing, vb. kullanılabilir.
