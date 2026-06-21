# `backend/data/`

Kalıcı uygulama verisi **MongoDB** ve yapılandırılmış blob depolamada (Drive / Cloudinary / R2 / yerel `uploads/`) tutulur.

## `pattern-pdf-import/`

PDF → soru import hattının **yerel çalışma kopyası**. Üretimde kullanılmaz; import scriptleri bittikten sonra ara dosyalar silinebilir:

```bash
npm run tool:cleanup-storage -- --dry-run
npm run tool:cleanup-storage -- --yes
```

Tam klasörü silmek için `--import-data` (PDF kaynağından yeniden import edilebilir).
