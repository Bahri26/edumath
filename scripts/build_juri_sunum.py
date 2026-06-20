#!/usr/bin/env python3
"""Bölüm II slaytlarından jüriye yönelik temiz sunum dosyası üretir."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs/edumath-sunum.md"
OUT_MD = ROOT / "docs/sunum-juri.md"
OUT_PDF = ROOT / "docs/sunum-juri.pdf"

HEADER = """# EDUMATH — Tez Savunma Sunumu

**Matematik Eğitiminde Yapay Zekâ Destekli Ölçme ve Değerlendirme Süreçlerinin Bütünleşik Modellenmesi**

Emre İncekalan · Anadolu Üniversitesi Lisansüstü Eğitim Enstitüsü  
Matematik eğitimi: Emre İncekalan · Yazılım: Bahri KOÇ

---

"""

JURI_REPLACEMENTS = {
    "Dürüstlük: pilot henüz yok": "Empirik pilot planlanıyor",
    "**→ CANLI GÖSTERİM (isteğe bağlı)**": "",
    "**→ CANLI GÖSTERİM**": "",
    " · *(Bölüm X)*": "",
    " · *(Bölüm XI)*": "",
    " · *(Bölüm IX)*": "",
}


def extract_bolum_ii(text: str) -> str:
    match = re.search(r"# BÖLÜM II —.*?(?=\n# BÖLÜM III)", text, re.DOTALL)
    if not match:
        raise ValueError("Bölüm II bulunamadı.")
    return match.group(0)


def clean_slide_title(line: str) -> str:
    line = re.sub(r"\s*`\[.*?\]`", "", line)
    line = re.sub(r"\s*⭐.*$", "", line)
    return line.strip()


def clean_ekran_line(line: str) -> str:
    for old, new in JURI_REPLACEMENTS.items():
        line = line.replace(old, new)
    line = re.sub(r"\*\*GÖRSEL:\*\*.*", "", line)
    line = re.sub(r"·\s*\*\(Bölüm [^)]+\)\*", "", line)
    return line.rstrip()


def normalize_markdown(body: str) -> str:
    """Markdown tabloları ve kod blokları için gerekli boş satırları ekler."""
    lines = body.splitlines()
    out: list[str] = []
    in_code = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("```"):
            if in_code:
                in_code = False
                out.append(line)
            else:
                if out and out[-1].strip() and not out[-1].strip().startswith("|"):
                    out.append("")
                in_code = True
                out.append(line)
            continue

        if in_code:
            out.append(line)
            continue

        if stripped.startswith("|"):
            if out and out[-1].strip() and not out[-1].strip().startswith("|"):
                out.append("")
            out.append(line)
            continue

        if not stripped:
            if out and out[-1].strip():
                out.append("")
            continue

        if out and out[-1].strip().startswith("|"):
            out.append("")
        out.append(line)

    return "\n".join(out).strip()


def build_juri_markdown(section: str) -> str:
    chunks = re.split(r"(?=## Slayt \d+)", section)
    slides: list[str] = []

    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk.startswith("## Slayt"):
            continue

        lines = chunk.splitlines()
        title = clean_slide_title(lines[0])
        ekran_lines: list[str] = []
        in_ekran = False

        for line in lines[1:]:
            stripped = line.strip()
            if stripped.startswith(("**ANLATIM**", "**AÇIKLAMA**", "**KONUŞMA**")):
                in_ekran = False
                continue
            if stripped.startswith("**GÖRSEL"):
                continue
            if stripped == "---":
                break
            if stripped.startswith("**EKRAN**"):
                in_ekran = True
                continue
            if in_ekran:
                cleaned = clean_ekran_line(line)
                if not cleaned.strip():
                    ekran_lines.append("")
                elif cleaned.strip():
                    ekran_lines.append(cleaned)

        if not ekran_lines:
            continue

        body = normalize_markdown("\n".join(ekran_lines).strip())
        slides.append(f"{title}\n\n{body}\n\n---\n")

    if len(slides) != 23:
        print(f"  Uyarı: {len(slides)} slayt çıkarıldı (beklenen 23).", file=sys.stderr)

    return HEADER + "\n".join(slides)


def write_and_pdf(md: str, *, pdf: bool) -> None:
    OUT_MD.write_text(md, encoding="utf-8")
    print(f"OK  {OUT_MD.relative_to(ROOT)}")

    if not pdf:
        return

    cmd = [
        sys.executable,
        str(ROOT / "scripts/md_to_pdf.py"),
        str(OUT_MD.relative_to(ROOT)),
    ]
    result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr or result.stdout, file=sys.stderr)
        raise SystemExit(result.returncode)
    print(result.stdout.strip())


def main() -> int:
    parser = argparse.ArgumentParser(description="Jüri sunum dosyasını üretir.")
    parser.add_argument("--no-pdf", action="store_true", help="Yalnızca markdown yaz")
    args = parser.parse_args()

    if not SRC.exists():
        print(f"HATA: {SRC} yok.", file=sys.stderr)
        return 1

    section = extract_bolum_ii(SRC.read_text(encoding="utf-8"))
    md = build_juri_markdown(section)
    write_and_pdf(md, pdf=not args.no_pdf)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
