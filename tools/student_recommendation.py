# Öğrenci Modelleme ve İçerik Öneri Sistemi (Basit Örnek)
# Bu script, öğrencinin geçmiş performansına göre içerik önerir.
# Gelişmiş öneri sistemleri için collaborative filtering, matrix factorization veya derin öğrenme kullanılabilir.

import pandas as pd
import numpy as np

# Örnek öğrenci-performans verisi (gerçek veriyi DB'den çekebilirsiniz)
data = [
    {'student_id': 1, 'topic': 'Algebra', 'score': 80},
    {'student_id': 1, 'topic': 'Geometry', 'score': 60},
    {'student_id': 1, 'topic': 'Probability', 'score': 40},
    {'student_id': 2, 'topic': 'Algebra', 'score': 90},
    {'student_id': 2, 'topic': 'Geometry', 'score': 85},
    {'student_id': 2, 'topic': 'Probability', 'score': 30},
]
df = pd.DataFrame(data)

# Öneri fonksiyonu: düşük skorlu konuları öner

def recommend_topics(student_id, threshold=70):
    user_scores = df[df['student_id'] == student_id]
    weak_topics = user_scores[user_scores['score'] < threshold]['topic'].tolist()
    if not weak_topics:
        return ['Tebrikler! Tüm konularda iyisiniz.']
    return weak_topics

# Örnek kullanım
target_student = 1
print(f"Öğrenci {target_student} için önerilen konular:")
print(recommend_topics(target_student))

# Node.js entegrasyonu için: Flask/FastAPI ile REST API açılabilir.
# Örnek endpoint: /api/recommend?student_id=1
