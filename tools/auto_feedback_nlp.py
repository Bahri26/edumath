# Otomatik Geri Bildirim ve NLP (spaCy ile örnek)
import spacy

# Türkçe model yüklü değilse: python -m spacy download tr_core_news_sm
try:
    nlp = spacy.load('tr_core_news_sm')
except:
    nlp = None
    print('Türkçe spaCy modeli yüklü değil!')

# Yanlış cevap örneği
wrong_answer = "Kare ve dikdörtgenin alan formüllerini karıştırdım."

# Anahtar kelime çıkarımı ve basit öneri
if nlp:
    doc = nlp(wrong_answer)
    keywords = [token.lemma_ for token in doc if token.pos_ in ['NOUN', 'PROPN']]
    print("Anahtar kelimeler:", keywords)
    # Basit öneri: anahtar kelimeye göre kaynak öner
    if 'alan' in keywords:
        print("Öneri: Alan formülleriyle ilgili tekrar materyali inceleyin.")
    else:
        print("Genel öneri: Konu anlatımını tekrar gözden geçirin.")
else:
    print("NLP analizi için spaCy Türkçe modeli gereklidir.")
