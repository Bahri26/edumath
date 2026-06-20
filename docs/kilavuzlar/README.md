# Edumath — Kullanım Kılavuzları

Öğretmen ve öğrenci için ayrı, sade dilde hazırlanmış rehberler.

| Dosya | Kim için |
|-------|----------|
| [ogretmen-kullanim-kilavuzu.md](../ogretmen-kullanim-kilavuzu.md) | Öğretmen |
| [ogrenci-kullanim-kilavuzu.md](../ogrenci-kullanim-kilavuzu.md) | Öğrenci |

## PDF üretimi

```powershell
cd c:\Projects\edumath-main
python scripts/md_to_pdf.py docs/ogretmen-kullanim-kilavuzu.md docs/ogrenci-kullanim-kilavuzu.md
```

Uygulama içi kısa rehber: `frontend/src/data/quickGuideContent.js` (GuideDrawer).
