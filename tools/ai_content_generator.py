# AI tabanlı eksik konu tespiti ve otomatik içerik üretimi örneği
# Soru türleri: çoktan seçmeli, boşluk doldurma, doğru-yanlış
import random

# Örnek eksik konu
missing_topic = 'Dikdörtgenin Alanı'

# Konu anlatımı (örnek)
def get_topic_explanation(topic):
    explanations = {
        'Dikdörtgenin Alanı': 'Dikdörtgenin alanı, kısa kenar ile uzun kenarın çarpımıyla bulunur. Formül: Alan = kısa kenar x uzun kenar.'
    }
    return explanations.get(topic, f'{topic} ile ilgili konu anlatımı bulunamadı.')

# Çoktan seçmeli soru üret
def generate_multiple_choice(topic):
    if topic == 'Dikdörtgenin Alanı':
        return {
            'type': 'multiple_choice',
            'question': 'Bir dikdörtgenin kısa kenarı 4 cm, uzun kenarı 7 cm ise alanı kaç cm² olur?',
            'options': ['11', '28', '21', '18'],
            'answer': '28'
        }
    return None

# Boşluk doldurma soru üret
def generate_fill_in_blank(topic):
    if topic == 'Dikdörtgenin Alanı':
        return {
            'type': 'fill_in_blank',
            'question': 'Dikdörtgenin alanı = ____ x ____',
            'answer': 'kısa kenar x uzun kenar'
        }
    return None

# Doğru-yanlış soru üret
def generate_true_false(topic):
    if topic == 'Dikdörtgenin Alanı':
        return {
            'type': 'true_false',
            'question': 'Dikdörtgenin alanı, kenar uzunluklarının toplamı ile bulunur.',
            'answer': False
        }
    return None

# Örnek çıktı
print('Konu anlatımı:')
print(get_topic_explanation(missing_topic))
print('\nÇoktan seçmeli:')
print(generate_multiple_choice(missing_topic))
print('\nBoşluk doldurma:')
print(generate_fill_in_blank(missing_topic))
print('\nDoğru-yanlış:')
print(generate_true_false(missing_topic))
