# Anket Verisi Analizi için Python Scripti

import pandas as pd
import json

# Örnek: survey_answers.json dosyasını API'den indirdiğinizi varsayalım
# [{"id": 1, "response_id": 1, "question_id": 1, "answer": "Çok iyi"}, ...]

with open('survey_answers.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

df = pd.DataFrame(data)

# Soru bazında yanıt dağılımı (örnek: çoktan seçmeli sorular için)
for qid in df['question_id'].unique():
    print(f"\nSoru ID: {qid}")
    counts = df[df['question_id'] == qid]['answer'].value_counts()
    print(counts)

# Açık uçlu (text) yanıtlar için örnek çıktı
text_answers = df[df['answer'].str.len() > 30]  # 30 karakterden uzun yanıtlar
print("\nUzun metin yanıtları örnekleri:")
print(text_answers[['question_id', 'answer']].head())

# İstatistiksel analiz veya NLP için buradan devam edebilirsiniz
# Örneğin: NLTK veya spaCy ile anahtar kelime çıkarımı, duygu analizi vb.
