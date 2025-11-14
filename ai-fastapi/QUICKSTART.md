# 🤖 AI-FastAPI Projesi - Hızlı Başlangıç

## 📌 Proje Özeti

EduMath için yapay zeka destekli matematik eğitim mikro servisi. Backend-express ve frontend-react ile entegre çalışır.

## 🎯 Ana Özellikler

### 1. **Soru Üretme** (Question Generation)
GPT-4 kullanarak otomatik matematik soruları üretir.
- Konu bazlı soru üretimi
- Zorluk seviyesi seçimi (kolay/orta/zor)
- Çoktan seçmeli, açık uçlu, doğru-yanlış formatları
- Türkçe/İngilizce destek

### 2. **Çözüm Analizi** (Solution Analysis)
Öğrenci çözümlerini AI ile değerlendirir.
- Adım adım çözüm kontrolü
- Hata tespiti ve öneriler
- Kısmi puan hesaplama
- Detaylı geri bildirim

### 3. **Kişiselleştirilmiş Öneriler** (Recommendations)
Öğrenci performansına göre özel öğrenme önerileri.
- Zayıf konuları tespit etme
- Öncelikli çalışma konuları
- Kişiselleştirilmiş soru setleri

### 4. **OCR Matematik** (Math OCR)
El yazısı matematik denklemlerini tanır.
- Fotoğraftan metin çıkarma
- LaTeX formatına dönüştürme
- Denklem çözümleme

### 5. **AI Chatbot Tutor**
Matematik konularında yardımcı asistan.
- 7/24 soru cevaplama
- Adım adım çözüm gösterme
- Kavram açıklamaları

### 6. **Performans Tahmini** (Performance Prediction)
ML modeli ile başarı tahmini.
- Gelecek sınav başarı tahmini
- Risk altındaki öğrencileri tespit
- Veri analizi ve raporlama

## 🚀 Kurulum

### 1. Proje Yapısını Oluştur
```bash
cd ai-fastapi
python setup_project.py
```

### 2. Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Paketleri Yükle
```bash
pip install -r requirements.txt
```

### 4. Çevre Değişkenlerini Ayarla
```bash
copy .env.example .env
```

`.env` dosyasında yapılandır:
- `OPENAI_API_KEY` - OpenAI API anahtarı
- `JWT_SECRET` - Backend ile aynı secret
- `MONGODB_URI` - Veritabanı bağlantısı

### 5. Servisi Başlat
```bash
uvicorn main:app --reload --port 8001
```

## 📡 API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/ai/generate-questions` | POST | Soru üretme |
| `/api/ai/analyze-solution` | POST | Çözüm analizi |
| `/api/ai/recommend` | POST | Öneriler |
| `/api/ai/ocr/math` | POST | OCR tanıma |
| `/api/ai/chat` | POST | Chatbot |
| `/api/ai/predict-performance` | POST | Performans tahmini |

## 🔗 Backend Entegrasyonu

### Backend-Express'ten AI Servisine İstek Atma

```javascript
// backend-express/services/aiService.js
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

// Soru üretme
async function generateQuestions(topic, difficulty, count) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/ai/generate-questions`,
      { topic, difficulty, count, language: 'tr' }
    );
    return response.data;
  } catch (error) {
    console.error('AI Service Error:', error.message);
    throw error;
  }
}

// Çözüm analizi
async function analyzeSolution(question, correctAnswer, studentAnswer) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/ai/analyze-solution`,
      { question, correct_answer: correctAnswer, student_answer: studentAnswer }
    );
    return response.data;
  } catch (error) {
    console.error('AI Service Error:', error.message);
    throw error;
  }
}

module.exports = {
  generateQuestions,
  analyzeSolution
};
```

### Backend Route Örneği

```javascript
// backend-express/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const auth = require('../middleware/auth');

// Soru üretme endpoint'i
router.post('/generate-questions', auth, async (req, res) => {
  try {
    const { topic, difficulty, count } = req.body;
    const result = await aiService.generateQuestions(topic, difficulty, count);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

Backend server.js'e ekle:
```javascript
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai-proxy', aiRoutes);
```

## 🎨 Frontend Kullanımı

### React'ten API Çağırma

```javascript
// frontend-react/src/services/aiService.js
import axios from 'axios';

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8001/api/ai';

// Soru üretme
export const generateQuestions = async (topic, difficulty, count) => {
  try {
    const response = await axios.post(`${AI_API_URL}/generate-questions`, {
      topic,
      difficulty,
      count,
      language: 'tr'
    });
    return response.data;
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
};

// Chatbot
export const sendChatMessage = async (message, history = []) => {
  try {
    const response = await axios.post(`${AI_API_URL}/chat`, {
      message,
      conversation_history: history
    });
    return response.data;
  } catch (error) {
    console.error('Chat Error:', error);
    throw error;
  }
};
```

### React Component Örneği

```jsx
// frontend-react/src/components/AIQuestionGenerator.jsx
import { useState } from 'react';
import { generateQuestions } from '../services/aiService';

function AIQuestionGenerator() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('orta');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateQuestions(topic, difficulty, 5);
      setQuestions(result.questions);
    } catch (error) {
      alert('Soru üretilemedi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>AI Soru Üretici</h2>
      <input 
        value={topic} 
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Konu (örn: Doğrusal Denklemler)"
      />
      <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
        <option value="kolay">Kolay</option>
        <option value="orta">Orta</option>
        <option value="zor">Zor</option>
      </select>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Üretiliyor...' : 'Soru Üret'}
      </button>
      
      {questions.map((q, idx) => (
        <div key={idx}>
          <h3>Soru {idx + 1}</h3>
          <p>{q.question_text}</p>
        </div>
      ))}
    </div>
  );
}

export default AIQuestionGenerator;
```

## 📂 Proje Yapısı

```
ai-fastapi/
├── main.py                  # Ana FastAPI uygulaması
├── requirements.txt         # Python bağımlılıkları
├── .env.example            # Örnek çevre değişkenleri
├── setup_project.py        # Proje yapısı oluşturucu
├── app/
│   ├── models/
│   │   └── schemas.py      # Pydantic modelleri
│   ├── routers/
│   │   ├── question_generation.py
│   │   ├── solution_analysis.py
│   │   ├── recommendations.py
│   │   ├── ocr.py
│   │   ├── chatbot.py
│   │   └── performance_prediction.py
│   ├── services/
│   │   └── openai_service.py
│   ├── middleware/
│   │   ├── auth.py
│   │   └── rate_limit.py
│   ├── utils/
│   └── ml_models/          # Trained ML modelleri
├── tests/
│   ├── unit/
│   └── integration/
└── data/
    ├── training/           # Eğitim verileri
    └── cache/              # Cache verileri
```

## 🧪 Test

```bash
# API'yi test et
curl http://localhost:8001/health

# Swagger UI
http://localhost:8001/docs

# ReDoc
http://localhost:8001/redoc
```

## 💡 Geliştirme İpuçları

1. **OpenAI API Maliyetleri**: Rate limiting ekleyin, cache kullanın
2. **Performans**: Async işlemler kullanın (FastAPI async/await)
3. **Güvenlik**: JWT token doğrulaması, rate limiting
4. **Monitoring**: Logging ekleyin, hata takibi yapın
5. **Testing**: Unit ve integration testler yazın

## 📊 Maliyet Optimizasyonu

- GPT-3.5-turbo kullanın (GPT-4'ten daha ucuz)
- Yanıtları cache'leyin (aynı sorular için)
- Rate limiting ile aşırı kullanımı engelleyin
- Batch işlemler yapın (çoklu sorular)

## 🔮 Gelecek Özellikler

- [ ] Soru havuzu öğrenme (Fine-tuning)
- [ ] Görüntü tanıma (diagram, grafik)
- [ ] Ses tanıma (speech-to-text)
- [ ] Video analizi
- [ ] Gerçek zamanlı collaboration
- [ ] Advanced analytics dashboard

## 🤝 Destek

Sorular için: bahadir26@hotmail.com

## 📝 Lisans

MIT License - EduMath AI Service
