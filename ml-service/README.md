# Edumath ML Service

Backend (`backend/`) dışında, proje kökünde çalışan bağımsız Python makine öğrenmesi mikroservisi.

## Klasör yapısı

```
ml-service/
├── main.py              # FastAPI giriş noktası
├── requirements.txt     # Python bağımlılıkları
├── .env.example
├── README.md
└── services/
    ├── __init__.py
    ├── health.py        # Sağlık kontrolü
    └── weak_topics.py   # Konu / zayıf alan skorlama
```

## Kurulum

```bash
cd ml-service
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

## Çalıştırma

```bash
python main.py
```

Servis varsayılan olarak `http://localhost:8100` adresinde açılır.

## API uçları

| Metot | Yol | Açıklama |
|--------|-----|----------|
| GET | `/health` | Servis durumu |
| POST | `/analyze/topics` | Zayıf konuları sırala |
| POST | `/score/topics` | Konu skorlarını hesapla |

### Örnek istek

```bash
curl -X POST http://localhost:8100/analyze/topics \
  -H "Content-Type: application/json" \
  -d "{\"entries\":[{\"topic\":\"Örüntüler\",\"total\":10,\"correct\":4,\"accuracy\":0.4}]}"
```

## Node backend ile entegrasyon

Backend `ML_SERVICE_URL` tanımlıysa öğrenci konu analizi bu servise gider; aksi halde Node içindeki `ml-matrix` fallback devreye girer.

`backend/.env`:

```env
ML_SERVICE_URL=http://localhost:8100
ML_SERVICE_API_KEY=
ML_WEAK_TOPIC_THRESHOLD=0.55
ML_SERVICE_TIMEOUT_MS=8000
```

Test:

```bash
# Terminal 1 — ML servisi
cd ml-service && python main.py

# Terminal 2 — backend
cd backend && npm run verify:ml-service
```

Render Blueprint (`render.yaml`) `edumath-ml` servisini otomatik ekler; `edumath-api` içinde `ML_SERVICE_URL` bu servise bağlanır.

API health: `GET https://<api>/health` → `mlService.status: "up"`.

Öğrenci uç noktası: `GET /api/ai/student-insights` → `scoringProvider: "ml-service"`.

## Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `ML_SERVICE_HOST` | `0.0.0.0` | Dinleme adresi |
| `ML_SERVICE_PORT` | `8100` | Port |
| `ML_WEAK_TOPIC_THRESHOLD` | `0.55` | Zayıf konu eşiği |
| `ML_SERVICE_API_KEY` | (boş) | Dolu ise isteklerde `X-API-Key` gerekir |
