# Örüntü PDF İçe Aktarım

Doktora tezi KTT/BTT örüntü PDF paketlerini Edumath soru bankasına yükler.

## Gereksinimler

- Python 3 + `pymupdf`, `pillow`, `numpy`
- Node.js bağımlılıkları (`tesseract.js`, `sharp`)
- `backend/.env` içinde `MONGODB_URI`
- PDF dosyaları varsayılan klasörde:
  `OneDrive\Masaüstü\Bahri\Doktora Tezi\`

## PDF dosyaları

| Sınıf | Dosya |
|-------|-------|
| 5 | `5 sınıf örüntü başlık.pdf` |
| 6 | `6 sınıf örüntü - başlık.pdf` |
| 7 | `7 sınıf örüntü başlık.pdf` |
| 9 | `9. SINIF ORUNTÜ SORULARI.pdf` |

Her sınıf: **21 soru** → sırayla **7 Kolay + 7 Orta + 7 Zor** etiketlenir.

## Çalıştırma

```bash
cd backend
CONFIRM_PATTERN_PDF_IMPORT=YES npm run import:pattern-pdf
```

### Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `PATTERN_PDF_DIR` | OneDrive Doktora Tezi | PDF klasörü |
| `PATTERN_PDF_REPLACE` | `true` | İlgili sınıfın eski örüntü sorularını siler |
| `PATTERN_PDF_GRADES` | (boş = hepsi) | Örn. `5,9` veya `9. Sınıf` |
| `ML_SERVICE_URL` | (opsiyonel) | Çözüm adımı zenginleştirme |

## Akış

1. Python: PDF → PNG sayfalar + cevap anahtarı (9. sınıf metin katmanından)
2. Node OCR (Tesseract): her soru bölgesinden metin + şıklar
3. ML servis / yerel çözücü: çözüm adımları + eksik doğru cevap
4. Görsel tespit: diyagramlı sorulara kırpılmış görsel yüklenir
5. MongoDB: 21 soru + sınıf başına tarama sınavı kaydı

## Düzeltme listesi

```bash
cd backend
npm run import:pattern-pdf-review
```

Çıktılar:
- `docs/pattern-pdf-duzeltme-listesi.md` — soru soru inceleme rehberi
- `docs/pattern-pdf-duzeltme-ozet.csv` — Excel’de filtrelemek için özet
- `docs/pattern-pdf-cevap-anahtari-9-sinif.md` — 9. sınıf PDF anahtarı

## ML ile yeniden zenginleştirme

```bash
CONFIRM_PATTERN_PDF_PATCH=YES npm run import:pattern-pdf-patch
```

## 9. sınıf cevap anahtarı uygulama

```bash
node scripts/import/applyPatternPdfAnswerKeys.js
```

## Not

- **5–7. sınıf:** Ayrı cevap anahtarı PDF’i yok; şık/cevap OCR + ML tahminidir.
- **9. sınıf:** PDF anahtarı var; şık metinleri yine OCR ile kontrol edilmeli.
- Taranmış PDF’lerde öğretmen panelinden metin/şık düzeltmesi önerilir.
