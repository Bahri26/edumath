# Edumath Sunum Materyalleri

## İki dosya — karıştırmayın

| Dosya | Kim için | İçerik |
|-------|----------|--------|
| **[sunum-juri.pdf](../sunum-juri.pdf)** | **Jüri / projeksiyon** | Yalnızca 23 slayt |
| **[doktora-sunum-anlatim.pdf](../doktora-sunum-anlatim.pdf)** | **Siz (referans)** | Matematik + yöntem + yazılım derin anlatım (konuşma metni yok) |
| **[edumath-sunum.md](../edumath-sunum.md)** | **Siz (konuşma)** | Bölüm II KONUŞMA + S&C — jüriye vermeyin |

## Tam anlatım PDF

```powershell
python scripts/md_to_pdf.py docs/doktora-sunum-anlatim.md
```

## Jüri sunumunu yenileme

Slayt metnini `edumath-sunum.md` → **Bölüm II**’de düzenleyin; ardından:

```powershell
cd c:\Projects\edumath-main
python scripts/build_juri_sunum.py
```

Bu komut `docs/sunum-juri.md` ve `docs/sunum-juri.pdf` üretir.

İlk kurulum: `python -m playwright install chromium`

## Hazırlık PDF (isteğe bağlı)

Tam kitaplık PDF’i (iç notlar gizli ANLATIM ile):

```powershell
python scripts/md_to_pdf.py docs/edumath-sunum.md
```

## Ekran görüntüleri (`docs/sunum/`)

| Dosya | Slayt |
|-------|-------|
| `01-mimari.png` | 10 |
| `02-soru-bankasi.png` | 18 |
| `03-uretim-hatti.png` | 11 |
| `04-egzersiz-akisi.png` | 19 |
| `05-ogrenci-sonuc.png` | 12 |
| `06-ogretmen-rapor.png` | 13 |

## Eski dosyalar

Ayrı sunum dosyaları `edumath-sunum.md` içinde birleştirildi.
