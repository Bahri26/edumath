# Edumath ML Service

Backend (`backend/`) dışında, proje kökünde çalışan bağımsız Python mikroservisi. **Dış AI yok** — soru ayrıştırma, çözüm, konu analizi ve zayıf alan skorlama yerel algoritmalarla yapılır.

## Klasör yapısı

```
ml-service/
├── main.py                    # FastAPI giriş noktası
├── requirements.txt
├── .env.example
├── README.md
└── services/
    ├── health.py
    ├── weak_topics.py         # Öğrenci zayıf konu skorlama
    ├── question_solver.py     # Örüntü / geometri / cebir çözücü
    ├── question_parse.py      # OCR metni → soru + şıklar
    └── question_analyze.py    # Konu, zorluk, etiket çıkarımı
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
| GET | `/health` | Servis durumu ve yetenekler |
| POST | `/analyze/topics` | Zayıf konuları sırala |
| POST | `/score/topics` | Konu skorlarını hesapla |
| POST | `/questions/solve` | Bilinen örüntü tipini çöz |
| POST | `/questions/parse-text` | OCR metnini ayrıştır |
| POST | `/questions/analyze` | Konu / zorluk / etiket |
| POST | `/questions/enrich` | Ayrıştır + analiz + çözüm (tek çağrı) |
| POST | `/questions/generate-from-pool` | Havuz stiline göre yeni soru üret |

### Örnek: soru zenginleştirme

```bash
curl -X POST http://localhost:8100/questions/enrich \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Birim küp örüntüsünde kural hangisidir?\",\"options\":[\"4x\",\"2x+2\",\"x+3\",\"3x\"],\"ocrPreview\":\"1. adım 3 küp 2. adım 6 küp 3. adım 9 küp\"}"
```

### Örnek: zayıf konu analizi

```bash
curl -X POST http://localhost:8100/analyze/topics \
  -H "Content-Type: application/json" \
  -d "{\"entries\":[{\"topic\":\"Örüntüler\",\"total\":10,\"correct\":4,\"accuracy\":0.4}]}"
```

## Node backend ile entegrasyon

`ML_SERVICE_URL` tanımlıysa:

- Smart Paste / OCR sonrası `enrichParsedQuestion` → `/questions/enrich`
- Metin ayrıştırma → `/questions/parse-text`
- Öğrenci konu analizi → `/analyze/topics`

Tanımlı değilse Node içindeki yerel JS çözücü ve `ml-matrix` fallback devreye girer.

`backend/.env`:

```env
ML_SERVICE_URL=http://localhost:8100
ML_SERVICE_API_KEY=
ML_WEAK_TOPIC_THRESHOLD=0.55
ML_SERVICE_TIMEOUT_MS=12000
```

Test:

```bash
# Terminal 1 — ML servisi
cd ml-service && python main.py

# Terminal 2 — backend
cd backend && npm run verify:ml-service
```

Render Blueprint (`render.yaml`) `edumath-ml` servisini ekler; `edumath-api` içinde `ML_SERVICE_URL` bu servise bağlanır.

API health: `GET https://<api>/health` → `mlService.status: "up"`.

## Desteklenen soru tipleri (yerel çözücü)

| Tip | Örnek |
|-----|-------|
| Altıgen örüntüsü | n. adımda 2n altıgen |
| Üçgen çevresi | MEB: P(n) = 4n + 4s |
| Cebirsel kural | Birim küp: 3x, 4x, 2x+2 |
| Aritmetik dizi | Şıklarda düzenli artış |

Yeni tipler `services/question_solver.py` içine eklenir; dış API gerekmez.

## Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `ML_SERVICE_HOST` | `0.0.0.0` | Dinleme adresi |
| `ML_SERVICE_PORT` | `8100` | Port |
| `ML_WEAK_TOPIC_THRESHOLD` | `0.55` | Zayıf konu eşiği |
| `ML_SERVICE_API_KEY` | (boş) | Dolu ise isteklerde `X-API-Key` gerekir |
