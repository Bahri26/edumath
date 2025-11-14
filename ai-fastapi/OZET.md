# 🤖 AI-FastAPI Özet Dokümantasyon

## 📋 Proje Hakkında

**ai-fastapi** klasörü, EduMath platformu için yapay zeka destekli özellikler sağlayan bir Python/FastAPI mikro servisidir. Backend-express (Node.js) ve frontend-react ile entegre çalışır.

## 🎯 6 Ana Özellik

### 1. 📝 Otomatik Soru Üretme
- OpenAI GPT kullanarak matematik soruları üretir
- Konu, zorluk, soru tipi seçilebilir
- Endpoint: `POST /api/ai/generate-questions`

### 2. ✅ Çözüm Analizi
- Öğrenci cevaplarını AI ile değerlendirir
- Hata tespiti ve kısmi puan verir
- Endpoint: `POST /api/ai/analyze-solution`

### 3. 🎓 Kişiselleştirilmiş Öneriler
- Öğrenci performansına göre çalışma önerileri
- Zayıf konuları tespit eder
- Endpoint: `POST /api/ai/recommend`

### 4. 📷 OCR Matematik
- El yazısı matematik denklemlerini tanır
- Fotoğraftan LaTeX'e çevirir
- Endpoint: `POST /api/ai/ocr/math`

### 5. 💬 AI Chatbot Tutor
- Matematik sorularına yardımcı asistan
- 7/24 destek, adım adım çözüm
- Endpoint: `POST /api/ai/chat`

### 6. 📊 Performans Tahmini
- ML ile gelecek sınav başarısını tahmin eder
- Risk altındaki öğrencileri belirler
- Endpoint: `POST /api/ai/predict-performance`

## 🚀 Hızlı Kurulum

```bash
# 1. Klasöre git
cd ai-fastapi

# 2. Proje yapısını oluştur
python setup_project.py

# 3. Virtual environment
python -m venv venv
venv\Scripts\activate

# 4. Paketleri yükle
pip install -r requirements.txt

# 5. Çevre değişkenleri
copy .env.example .env
# .env dosyasını düzenle (OPENAI_API_KEY ekle)

# 6. Servisi başlat
uvicorn main:app --reload --port 8001
```

## 📡 API Test

```bash
# Sağlık kontrolü
curl http://localhost:8001/health

# Swagger UI (Otomatik dokümantasyon)
http://localhost:8001/docs
```

## 🔗 Backend Entegrasyonu

### Backend-Express'e Ekle

1. **AI Service dosyası oluştur:**
   ```bash
   copy ai-fastapi\aiService.js.example backend-express\services\aiService.js
   ```

2. **Route oluştur:** `backend-express/routes/aiRoutes.js`
   ```javascript
   const express = require('express');
   const router = express.Router();
   const AIService = require('../services/aiService');
   const auth = require('../middleware/auth');

   router.post('/generate-questions', auth, async (req, res) => {
     try {
       const { topic, difficulty, count } = req.body;
       const result = await AIService.generateQuestions(topic, difficulty, count);
       res.json(result);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });

   module.exports = router;
   ```

3. **server.js'e ekle:**
   ```javascript
   const aiRoutes = require('./routes/aiRoutes');
   app.use('/api/ai', aiRoutes);
   ```

4. **.env dosyasına ekle:**
   ```
   AI_SERVICE_URL=http://localhost:8001
   ```

## 🎨 Frontend Entegrasyonu

### React'e Ekle

1. **AI Service dosyası oluştur:**
   ```bash
   copy ai-fastapi\aiService.jsx.example frontend-react\src\services\aiService.js
   ```

2. **Component'te kullan:**
   ```jsx
   import { generateQuestions } from '../services/aiService';

   function QuestionGenerator() {
     const handleGenerate = async () => {
       const result = await generateQuestions('Doğrusal Denklemler', 'orta', 5);
       console.log(result.questions);
     };

     return <button onClick={handleGenerate}>Soru Üret</button>;
   }
   ```

3. **.env dosyasına ekle:**
   ```
   VITE_AI_API_URL=http://localhost:8001/api/ai
   ```

## 📂 Klasör Yapısı

```
ai-fastapi/
├── main.py                     # Ana FastAPI uygulaması
├── requirements.txt            # Python paketleri
├── .env.example               # Örnek çevre değişkenleri
├── setup_project.py           # Proje kurulum scripti
├── aiService.js.example       # Backend entegrasyon örneği
├── aiService.jsx.example      # Frontend entegrasyon örneği
├── README.md                  # Detaylı dokümantasyon
├── QUICKSTART.md              # Hızlı başlangıç rehberi
├── OZET.md                    # Bu dosya
└── app/
    ├── models/
    │   └── schemas.py         # Pydantic data modelleri
    ├── routers/
    │   ├── question_generation.py
    │   ├── solution_analysis.py
    │   ├── recommendations.py
    │   ├── ocr.py
    │   ├── chatbot.py
    │   └── performance_prediction.py
    ├── services/
    │   └── openai_service.py  # OpenAI API servisi
    ├── middleware/
    │   ├── auth.py            # JWT doğrulama
    │   └── rate_limit.py      # Rate limiting
    └── utils/
```

## 🔑 Gerekli API Anahtarları

### OpenAI API Key
1. https://platform.openai.com/ adresine git
2. API Keys bölümünden yeni anahtar oluştur
3. `.env` dosyasına ekle: `OPENAI_API_KEY=sk-...`

### JWT Secret
Backend ile aynı secret kullan:
```
JWT_SECRET=backend-express/.env dosyasındaki ile aynı
```

## 💰 Maliyet Bilgisi

### OpenAI Fiyatları (Örnek)
- **GPT-3.5-turbo**: ~$0.002 / 1K token (ekonomik)
- **GPT-4**: ~$0.06 / 1K token (güçlü ama pahalı)

### Tasarruf İpuçları
- GPT-3.5-turbo kullanın (çoğu işlem için yeterli)
- Rate limiting ekleyin
- Yanıtları cache'leyin
- Batch işlemler yapın

## 🧪 Kullanım Örnekleri

### Soru Üretme
```bash
curl -X POST http://localhost:8001/api/ai/generate-questions \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Doğrusal Denklemler",
    "difficulty": "orta",
    "count": 3,
    "question_type": "coktan_secmeli",
    "language": "tr"
  }'
```

### Çözüm Analizi
```bash
curl -X POST http://localhost:8001/api/ai/analyze-solution \
  -H "Content-Type: application/json" \
  -d '{
    "question": "2x + 5 = 15 denklemini çöz",
    "correct_answer": "x = 5",
    "student_answer": "x = 5",
    "student_work": "2x = 15 - 5, 2x = 10, x = 5"
  }'
```

### Chatbot
```bash
curl -X POST http://localhost:8001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Doğrusal denklem nedir?",
    "conversation_history": []
  }'
```

## ⚠️ Önemli Notlar

1. **Python 3.8+** gereklidir
2. **OpenAI API Key** olmadan çalışmaz
3. **Port 8001** kullanır (değiştirilebilir)
4. Backend ve Frontend'den **bağımsız** çalışır
5. **Rate limiting** eklenmesi önerilir (maliyet kontrolü)

## 🔄 Geliştirme Aşamaları

**✅ Tamamlanan:**
- [x] Proje yapısı
- [x] Ana dosyalar (main.py, requirements.txt)
- [x] Schemas (Pydantic modelleri)
- [x] Middleware (auth, rate limit)
- [x] OpenAI servisi
- [x] Dokümantasyon

**🚧 Yapılacak:**
- [ ] Router'ları tamamla (6 endpoint)
- [ ] OpenAI entegrasyonunu test et
- [ ] ML modellerini eğit (performans tahmini için)
- [ ] OCR sistemini kur (Tesseract)
- [ ] Unit testler yaz
- [ ] Docker containerization
- [ ] Production deploy

## 📞 Destek

- **Dokümantasyon**: README.md, QUICKSTART.md
- **API Docs**: http://localhost:8001/docs (servis çalışırken)
- **İletişim**: bahadir26@hotmail.com

## 🎓 Öğrenme Kaynakları

- FastAPI: https://fastapi.tiangolo.com/
- OpenAI API: https://platform.openai.com/docs
- Pydantic: https://docs.pydantic.dev/
- Python Async: https://docs.python.org/3/library/asyncio.html

---

**Sonraki Adım:** `python setup_project.py` çalıştırarak proje yapısını oluşturun!
