# Resimli örüntü soru paketi

Dört PDF'nin tamamı `backend/data/pattern-pdf-import` altında metin, seçenek,
doğru cevap, çözüm ve özgün soru görseli olarak saklanır.

| Sınıf | Soru ve görsel | Kolay | Orta | Zor |
|---|---:|---:|---:|---:|
| 5 | 22 | 12 | 6 | 4 |
| 6 | 30 | 20 | 6 | 4 |
| 7 | 22 | 12 | 6 | 4 |
| 9 | 21 | 7 | 7 | 7 |
| Toplam | 95 | 51 | 25 | 19 |

## Soru biçimi

Kaynaklar çoktan seçmelidir: 5–7. sınıfta dört, 9. sınıfta beş seçenek vardır.
`assessmentMeta.imageRole = full-question` metin, şekil ve görsel seçenekleri
birlikte gösterir. Aranabilir metin kayıtta tutulur; sınavda ikinci kez gösterilmez.
5. sınıf sayfa 4 ve 6. sınıf sayfa 3 sorularına ortak açıklama ayrıca eklenmiştir.

5–7. sınıf zorlukları test ailesine göre başlangıç etiketleridir. 9. sınıfın 7/7/7
ayrımı geçici editoryal etikettir; PDF'de zorluk bölümleri yoktur. Öğrenci
performansına dayalı kalibrasyon ayrıca yapılmalıdır.

## Yerel kontrol ve önizleme

Backend klasöründe, veritabanına bağlanmadan:

```powershell
node scripts/import/importExtractedPatternQuestions.js --local-preview
node scripts/import/previewExtractedPatternQuestions.js
node --test scripts/tests/extractedPatternPack.test.js
```

`data/pattern-pdf-import/preview.html` tüm soruları sınıfa göre filtreler ve
cevap/çözümünü açar. Eksik görsel, yinelenen kaynak kimliği, şıklarda bulunmayan
cevap veya inceleme bekleyen soru aktarımı durdurur. Cevap tahmin edilmez.

## Veritabanını güncelleme

Önce salt okunur denetim:

```powershell
node scripts/import/importExtractedPatternQuestions.js
```

Ardından aktarım:

```powershell
$env:CONFIRM_EXTRACTED_PATTERN_IMPORT='YES'
npm run import:extracted-patterns
```

`.env` içindeki MongoDB ve depolama ayarları kullanılır. Yalnızca
`pattern-pdf-extracted-2026-08` kaynaklı kayıtlar güncellenir. Mevcut soru
kimlikleri ve sınav referansları korunur; tekrar aktarım soruları çoğaltmaz.
Sınıf başına 22/30/22/21 soruluk sınav güncellenir. Diğer sorular silinmez.
`EXTRACTED_PATTERN_GRADES=5,9` sınıf filtresidir.
`EXTRACTED_PATTERN_CREATE_EXAM=false` sınav güncellemesini kapatır.
Görsel yüklenemediğinde eksik görselli soru kaydedilmez.
Silerek yeniden aktaran `EXTRACTED_PATTERN_REPLACE_MINE` artık desteklenmez.

## Görselleri yeniden üretme

Python + Pillow ve PATH üzerinde Poppler `pdftoppm` gerekir:

```powershell
python scripts/import/preparePatternPdfImages.py --pdf-dir 'C:/Users/kocba/OneDrive/Masaüstü/Bahri/Doktora Tezi'
node scripts/import/previewExtractedPatternQuestions.js
```

PDF'ler değiştirilmez. Soru bölgeleri kırpılır; cevap anahtarı görsellere dahil
edilmez. Kaynak kırpım koordinatları `sourceCrop` alanında saklanır.
Eski OCR betikleri `_archive-ocr-pdf-pipeline` içindedir; bu paket için kullanılmaz.
