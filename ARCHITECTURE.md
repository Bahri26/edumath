# 🔗 EduMath Proje Mimarisi ve Bağlantılar

## 📊 3-Tier Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│                  Port: 5173 (Vite Dev)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Components (UI)                                   │   │
│  │  • Pages (Routing)                                   │   │
│  │  • Services (API Calls)                              │   │
│  │  • Context (Global State)                            │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP REST API
                     │ axios calls
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                BACKEND (Express/Node.js)                     │
│                     Port: 8000                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • Routes (API Endpoints)                            │   │
│  │  • Controllers (Business Logic)                      │   │
│  │  • Models (MongoDB Schemas)                          │   │
│  │  • Middleware (Auth, Validation)                     │   │
│  └─────────────────────────────────────────────────────┘   │
└────┬──────────────────────┬─────────────────────────────────┘
     │                      │
     │ MongoDB              │ HTTP REST API
     │                      │ axios calls
     ▼                      ▼
┌──────────┐    ┌─────────────────────────────────────────────┐
│ MongoDB  │    │         AI SERVICE (FastAPI/Python)          │
│ Database │    │              Port: 8001                      │
│          │    │  ┌──────────────────────────────────────┐   │
└──────────┘    │  │  • OpenAI GPT Integration            │   │
                │  │  • Question Generation               │   │
                │  │  • Solution Analysis                 │   │
                │  │  • ML Models (Scikit-learn)          │   │
                │  └──────────────────────────────────────┘   │
                └─────────────────────────────────────────────┘
```

## 🔄 Servisler Arası İletişim

### 1️⃣ Frontend → Backend
**Protokol:** HTTP/REST API  
**Port:** Frontend (5173) → Backend (8000)  
**Kullanım:** Axios ile API çağrıları

```javascript
// frontend-react/src/services/api.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Örnek: Sınav listesi al
export const getExams = () => api.get('/exams');
export const createExam = (data) => api.post('/exams', data);
```

**Bağlantı Dosyası:** `.env`
```
VITE_API_BASE=http://localhost:8000/api
```

### 2️⃣ Backend → MongoDB
**Protokol:** MongoDB Wire Protocol  
**Port:** Backend (8000) → MongoDB (27017)  
**Kullanım:** Mongoose ORM

```javascript
// backend-express/server.js
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
```

**Bağlantı Dosyası:** `.env`
```
MONGO_URI=mongodb://localhost:27017/edumathDB
```

### 3️⃣ Backend → AI Service (YENİ!)
**Protokol:** HTTP/REST API  
**Port:** Backend (8000) → AI Service (8001)  
**Kullanım:** Axios ile AI endpoint'leri çağırma

```javascript
// backend-express/services/aiService.js
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

// AI'dan soru üret
const generateQuestions = async (topic, difficulty, count) => {
  const response = await axios.post(
    `${AI_SERVICE_URL}/api/ai/generate-questions`,
    { topic, difficulty, count }
  );
  return response.data;
};
```

**Bağlantı Dosyası:** `.env`
```
AI_SERVICE_URL=http://localhost:8001
```

### 4️⃣ Frontend → AI Service (Opsiyonel - Direct)
**Protokol:** HTTP/REST API  
**Port:** Frontend (5173) → AI Service (8001)  
**Kullanım:** Doğrudan AI servisine çağrı (bazı durumlarda)

```javascript
// frontend-react/src/services/aiService.js
import axios from 'axios';

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8001/api/ai';

export const generateQuestions = async (topic, difficulty, count) => {
  const response = await axios.post(`${AI_API_URL}/generate-questions`, {
    topic, difficulty, count
  });
  return response.data;
};
```

**Bağlantı Dosyası:** `.env`
```
VITE_AI_API_URL=http://localhost:8001/api/ai
```

## 📝 Servis Detayları

### Frontend-React (Port: 5173)
**Görev:** Kullanıcı arayüzü  
**Teknoloji:** React 19, Vite, React Router  
**Bağlantılar:**
- Backend'e API çağrıları (`axios`)
- AI Service'e direkt çağrı (opsiyonel)

**Örnek Akış:**
```
Kullanıcı "Sınav Oluştur" butonuna tıklar
  ↓
React Component (CreateExam.jsx)
  ↓
Service Call (examService.js)
  ↓
Axios POST → http://localhost:8000/api/exams
  ↓
Backend'den yanıt gelir
  ↓
State güncellenir, UI yenilenir
```

### Backend-Express (Port: 8000)
**Görev:** İş mantığı, veritabanı işlemleri, API sunma  
**Teknoloji:** Node.js, Express, MongoDB, Mongoose  
**Bağlantılar:**
- MongoDB'ye bağlanır
- Frontend'den istekleri karşılar
- AI Service'i çağırır (gerektiğinde)

**Örnek Akış:**
```
Frontend'den POST /api/exams isteği gelir
  ↓
Route (examRoutes.js) isteği yakalar
  ↓
Middleware (auth.js) token doğrular
  ↓
Controller (examController.js) iş mantığını çalıştırır
  ↓
Model (Exam.js) MongoDB'ye kaydeder
  ↓
Response Frontend'e döner
```

### AI-FastAPI (Port: 8001)
**Görev:** Yapay zeka işlemleri  
**Teknoloji:** Python, FastAPI, OpenAI, Scikit-learn  
**Bağlantılar:**
- Backend'den istekleri karşılar
- Frontend'den direkt çağrı alabilir
- OpenAI API'ye bağlanır
- MongoDB'ye bağlanabilir (opsiyonel)

**Örnek Akış:**
```
Backend'den POST /api/ai/generate-questions isteği gelir
  ↓
Router (question_generation.py) isteği yakalar
  ↓
Service (openai_service.py) GPT'ye prompt gönderir
  ↓
OpenAI API'den yanıt gelir
  ↓
JSON parse edilir, validation yapılır
  ↓
Response Backend'e döner
```

## 🔐 Güvenlik ve Authentication

### JWT Token Akışı
```
1. Kullanıcı login yapar (Frontend → Backend)
   POST /api/auth/login

2. Backend JWT token üretir
   { token: "eyJhbGc...", user: {...} }

3. Frontend token'ı localStorage'a kaydeder

4. Her API çağrısında token gönderilir
   Headers: { Authorization: "Bearer eyJhbGc..." }

5. Backend middleware token'ı doğrular
   verify(token, JWT_SECRET)

6. İstek işlenir veya 401 Unauthorized
```

### AI Service Authentication
```javascript
// Backend → AI Service
const token = generateJWT(userId); // Backend'deki JWT
axios.post(AI_URL, data, {
  headers: { Authorization: `Bearer ${token}` }
});

// AI Service token'ı doğrular (aynı JWT_SECRET)
// .env dosyalarında JWT_SECRET aynı olmalı!
```

## 🌐 CORS Ayarları

### Backend CORS
```javascript
// backend-express/server.js
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

### AI Service CORS
```python
# ai-fastapi/main.py
from fastapi.middleware.cors import CORSMiddleware

origins = ["http://localhost:5173", "http://localhost:8000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

## 📦 Tüm Servisleri Başlatma

### Windows PowerShell ile
```powershell
# Terminal 1 - MongoDB
mongod

# Terminal 2 - Backend
cd backend-express
npm run dev

# Terminal 3 - Frontend
cd frontend-react
npm run dev

# Terminal 4 - AI Service
cd ai-fastapi
venv\Scripts\activate
uvicorn main:app --reload --port 8001
```

### Kontrol Et
```
✓ MongoDB:   mongodb://localhost:27017
✓ Backend:   http://localhost:8000
✓ Frontend:  http://localhost:5173
✓ AI Service: http://localhost:8001
```

## 🔧 Çevre Değişkenleri (.env)

### backend-express/.env
```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/edumathDB
JWT_SECRET=your-super-secret-jwt-key-change-this
AI_SERVICE_URL=http://localhost:8001
NODE_ENV=development
```

### frontend-react/.env
```env
VITE_API_BASE=http://localhost:8000/api
VITE_AI_API_URL=http://localhost:8001/api/ai
```

### ai-fastapi/.env
```env
PORT=8001
OPENAI_API_KEY=sk-...
JWT_SECRET=your-super-secret-jwt-key-change-this  # Backend ile aynı!
MONGODB_URI=mongodb://localhost:27017/edumath_ai
BACKEND_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8000
```

## 🎯 Örnek: Tam Akış (AI Soru Üretme)

### Senaryo: Öğretmen AI ile soru üretmek istiyor

```
1. FRONTEND (Teacher Dashboard)
   ↓
   Öğretmen "AI ile Soru Üret" butonuna tıklar
   Component: CreateExamWithAI.jsx
   
2. FRONTEND → BACKEND
   ↓
   POST http://localhost:8000/api/ai/generate-questions
   Body: { topic: "Doğrusal Denklemler", difficulty: "orta", count: 5 }
   Headers: { Authorization: "Bearer <teacher_token>" }
   
3. BACKEND (Express)
   ↓
   Route: /api/ai/generate-questions (aiRoutes.js)
   Middleware: auth.js (token doğrula, teacher mı kontrol et)
   Controller: aiController.js
   
4. BACKEND → AI SERVICE
   ↓
   POST http://localhost:8001/api/ai/generate-questions
   Body: { topic: "Doğrusal Denklemler", difficulty: "orta", count: 5 }
   Service: aiService.js (axios kullanarak)
   
5. AI SERVICE (FastAPI)
   ↓
   Router: question_generation.py
   Service: openai_service.py
   
6. AI SERVICE → OPENAI API
   ↓
   POST https://api.openai.com/v1/chat/completions
   Prompt: "Sen bir matematik öğretmenisin..."
   
7. OPENAI → AI SERVICE
   ↓
   GPT soruları üretir
   
8. AI SERVICE → BACKEND
   ↓
   Response: { success: true, questions: [...], count: 5 }
   
9. BACKEND → FRONTEND
   ↓
   Response döner
   
10. FRONTEND
    ↓
    State güncellenir
    Sorular ekranda gösterilir
    Öğretmen soruları düzenleyebilir/kaydedebilir
```

## 🚀 Özet

**Frontend (React)** = Kullanıcı arayüzü, görsel kısım  
**Backend (Express)** = İş mantığı, veritabanı, API  
**AI Service (FastAPI)** = Yapay zeka işlemleri  

Hepsi birbirine **HTTP REST API** ile bağlı, **bağımsız** çalışabilir (mikroservis mimarisi).
