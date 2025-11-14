# EduMath AI Service - FastAPI

Yapay zeka destekli matematik eğitim özellikleri sağlayan mikro servis.

## 🎯 Özellikler

### 1. Soru Üretme (Question Generation)
- **Endpoint:** `POST /api/ai/generate-questions`
- Matematik soruları otomatik üretme
- Zorluk seviyesi ve konu seçimi
- LLM (GPT-4/3.5) tabanlı

### 2. Çözüm Analizi (Solution Analysis)
- **Endpoint:** `POST /api/ai/analyze-solution`
- Öğrenci çözümlerini adım adım analiz
- Hata tespiti ve öneriler
- Kısmi puan hesaplama

### 3. Kişiselleştirilmiş Öneriler (Personalized Recommendations)
- **Endpoint:** `POST /api/ai/recommend`
- Öğrenci performansına göre konu önerileri
- Zayıf alanları tespit etme
- ML modeli tabanlı

### 4. OCR Matematik (Math OCR)
- **Endpoint:** `POST /api/ai/ocr/math`
- El yazısı matematik denklemlerini tanıma
- Görüntüden LaTeX çevirme
- Tesseract OCR + ML

### 5. Chatbot Tutor
- **Endpoint:** `POST /api/ai/chat`
- Matematik konularında yardımcı AI
- Adım adım çözüm gösterme
- Conversation memory

### 6. Performans Tahmini (Performance Prediction)
- **Endpoint:** `POST /api/ai/predict-performance`
- Gelecek sınav başarı tahmini
- Risk altındaki öğrencileri belirleme
- Scikit-learn modeli

## 🛠️ Teknoloji Stack

- **FastAPI** - Modern, hızlı web framework
- **OpenAI API** - GPT-4/3.5 entegrasyonu
- **Scikit-learn** - ML modelleri
- **TensorFlow/PyTorch** - Derin öğrenme (OCR)
- **Tesseract OCR** - Görüntü tanıma
- **Pydantic** - Veri validasyonu
- **SQLAlchemy** - Veritabanı ORM (optional)

## 📦 Kurulum

```bash
cd ai-fastapi

# Virtual environment oluştur
python -m venv venv

# Virtual environment'ı aktif et
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Paketleri yükle
pip install -r requirements.txt

# .env dosyası oluştur
cp .env.example .env
# OPENAI_API_KEY ve diğer ayarları yapılandır

# Servisi başlat
uvicorn main:app --reload --port 8001
```

AI servisi `http://localhost:8001` adresinde çalışacak.

## 🔑 API Keys

`.env` dosyasında gerekli:
- `OPENAI_API_KEY` - OpenAI GPT kullanımı için
- `MONGODB_URI` - Veritabanı bağlantısı (opsiyonel)
- `JWT_SECRET` - Token doğrulama için (backend ile aynı)

## 📡 Backend Entegrasyonu

Backend-express servisi, gerektiğinde ai-fastapi'ye istek atar:

```javascript
// backend-express/services/aiService.js
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

async function generateQuestions(topic, difficulty, count) {
  const response = await axios.post(`${AI_SERVICE_URL}/api/ai/generate-questions`, {
    topic,
    difficulty,
    count
  });
  return response.data;
}
```

## 📚 Kullanım Örnekleri

### Soru Üretme
```bash
curl -X POST http://localhost:8001/api/ai/generate-questions \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Doğrusal Denklemler",
    "difficulty": "orta",
    "count": 5,
    "language": "tr"
  }'
```

### Çözüm Analizi
```bash
curl -X POST http://localhost:8001/api/ai/analyze-solution \
  -H "Content-Type: application/json" \
  -d '{
    "question": "2x + 5 = 15 denklemini çöz",
    "student_answer": "x = 5",
    "student_work": "2x = 10, x = 5"
  }'
```

## 🧪 Test

```bash
pytest tests/
```

## 📊 API Dökümantasyonu

FastAPI otomatik dokümantasyon sağlar:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## 🔄 Geliştirme Yol Haritası

- [x] Proje yapısı oluşturma
- [ ] Soru üretme endpoint'i
- [ ] Çözüm analizi endpoint'i
- [ ] Kişiselleştirilmiş öneriler
- [ ] OCR entegrasyonu
- [ ] Chatbot tutor
- [ ] ML modeli eğitimi
- [ ] Unit testler
- [ ] Docker containerization

## 📝 Notlar

- AI servisi backend'den bağımsız çalışır (mikro servis mimarisi)
- Rate limiting gerekebilir (OpenAI API maliyetleri)
- Cache mekanizması eklenebilir (aynı sorular için)
- Async işlemler için Celery/Redis kullanılabilir

## 🤝 İletişim

Sorular için: bahadir26@hotmail.com
