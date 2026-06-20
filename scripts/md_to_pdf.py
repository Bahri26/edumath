#!/usr/bin/env python3
"""Markdown → PDF (Türkçe uyumlu, Playwright/Chromium ile yüksek kalite)."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parents[1]

CSS = """
@page {
  size: A4;
  margin: 18mm 16mm 20mm 16mm;
}

* { box-sizing: border-box; }

html {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

body {
  font-family: "Times New Roman", Times, "Liberation Serif", serif;
  font-size: 12pt;
  line-height: 1.5;
  color: #000;
  max-width: 100%;
  margin: 0;
  padding: 0;
}

h1 {
  font-family: "Times New Roman", Times, "Liberation Serif", serif;
  font-size: 16pt;
  font-weight: 700;
  color: #000;
  line-height: 1.25;
  margin: 0 0 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid #333;
  page-break-after: avoid;
}

h2 {
  font-family: "Times New Roman", Times, "Liberation Serif", serif;
  font-size: 14pt;
  font-weight: 700;
  color: #000;
  margin: 28px 0 10px;
  padding-bottom: 4px;
  border-bottom: 1px solid #666;
  page-break-after: avoid;
}

h3 {
  font-family: "Times New Roman", Times, "Liberation Serif", serif;
  font-size: 12pt;
  font-weight: 700;
  color: #000;
  margin: 18px 0 8px;
  page-break-after: avoid;
}

h4 {
  font-family: "Times New Roman", Times, "Liberation Serif", serif;
  font-size: 12pt;
  font-weight: 700;
  color: #000;
  margin: 14px 0 6px;
}

p {
  margin: 0 0 10px;
  orphans: 3;
  widows: 3;
}

ul, ol {
  margin: 0 0 12px;
  padding-left: 22px;
}

li {
  margin: 4px 0;
}

li > p { margin: 0; }

strong, b {
  font-weight: 700;
  color: #000;
}

em { font-style: italic; }

a {
  color: #000;
  text-decoration: underline;
}

code {
  font-family: "Courier New", Courier, monospace;
  font-size: 10pt;
  background: #f5f5f5;
  color: #000;
  padding: 1px 5px;
  border-radius: 3px;
}

pre {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px 14px;
  margin: 10px 0 14px;
  overflow-x: auto;
  page-break-inside: avoid;
}

pre code {
  background: transparent;
  padding: 0;
  font-size: 8.5pt;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0 16px;
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
  page-break-inside: avoid;
}

thead { display: table-header-group; }

th {
  background: #f0f0f0;
  color: #000;
  font-weight: 700;
  text-align: left;
  padding: 8px 10px;
  border: 1px solid #000;
}

td {
  padding: 7px 10px;
  border: 1px solid #000;
  vertical-align: top;
}

tr:nth-child(even) td {
  background: #fafafa;
}

blockquote {
  border-left: 3px solid #333;
  margin: 12px 0;
  padding: 10px 14px;
  background: #f9f9f9;
  color: #000;
  font-size: 12pt;
  page-break-inside: avoid;
}

blockquote p:last-child { margin-bottom: 0; }

hr {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 24px 0;
}

h2.slide {
  page-break-before: always;
  margin-top: 0;
  padding-top: 4px;
  border-bottom: 2px solid #333;
  font-size: 14pt;
}

h2.slide:first-of-type {
  page-break-before: auto;
}

h1.doc-title {
  font-size: 16pt;
  text-align: center;
  border-bottom: none;
  margin-bottom: 24px;
}

.part-title {
  page-break-before: always;
  font-family: "Times New Roman", Times, serif;
  font-size: 14pt;
  color: #000;
  background: #e8e8e8;
  padding: 10px 14px;
  border: 1px solid #333;
  margin: 24px 0 16px;
}

/* Kapak benzeri ilk h1 sonrası */
body > h1:first-child + table,
body > h1:first-child + p {
  margin-top: 8px;
}

.anlatim-hidden {
  display: none !important;
  height: 0;
  overflow: hidden;
}

h2.slide {
  page-break-before: always;
}

h2.slide:first-of-type {
  page-break-before: avoid;
}
"""


def hide_anlatim_blocks(html: str) -> str:
    """Konuşma notlarını (AÇIKLAMA / KONUŞMA / ANLATIM) PDF slaytlarından çıkarır."""
    pattern = re.compile(
        r"(<p><strong>(?:ANLATIM|AÇIKLAMA|KONUŞMA)</strong>[^<]*</p>.*?)(?=<hr\s*/?>|<h2|<h1 class=\"part-title\">)",
        re.DOTALL | re.IGNORECASE,
    )

    def _wrap(match: re.Match[str]) -> str:
        return f'<div class="anlatim-hidden" aria-hidden="true">{match.group(1)}</div>'

    return pattern.sub(_wrap, html)


def postprocess_html(html: str, src_name: str) -> str:
    """Sunum dosyaları için slayt sınıfları ve bölüm başlıkları."""
    if "edumath-sunum" in src_name or "sunum-juri" in src_name or "sunum" in src_name:
        html = hide_anlatim_blocks(html)
        html = re.sub(
            r"<h2>Slayt (\d+)[^<]*</h2>",
            r'<h2 class="slide">Slayt \1</h2>',
            html,
            flags=re.IGNORECASE,
        )
        html = re.sub(
            r"<h1>EDUMATH — Tez Savunma Sunumu</h1>",
            r'<h1 class="doc-title">EDUMATH — Tez Savunma Sunumu</h1>',
            html,
        )
        html = re.sub(
            r"<h1>EDUMATH SUNUM</h1>",
            r'<h1 class="doc-title">EDUMATH SUNUM</h1>',
            html,
        )
        html = re.sub(
            r"<h1>BÖLÜM ([IVX]+)[^<]*</h1>",
            r'<h1 class="part-title">BÖLÜM \1</h1>',
            html,
        )
        html = re.sub(
            r"<h1>BÖLÜM ([IVX]+) —[^<]*</h1>",
            r'<h1 class="part-title">BÖLÜM \1</h1>',
            html,
        )
    return html


def md_to_html(md_text: str, title: str = "Edumath", src_name: str = "") -> str:
    html_body = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "sane_lists", "toc"],
    )
    html_body = postprocess_html(html_body, src_name)
    return f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>{title}</title>
  <style>{CSS}</style>
</head>
<body>
{html_body}
</body>
</html>"""


def convert_with_playwright(html: str, dst: Path) -> None:
    from playwright.sync_api import sync_playwright

    dst.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html, wait_until="networkidle")
        page.pdf(
            path=str(dst),
            format="A4",
            print_background=True,
            margin={
                "top": "18mm",
                "bottom": "20mm",
                "left": "16mm",
                "right": "16mm",
            },
            display_header_footer=True,
            header_template="<div></div>",
            footer_template=(
                '<div style="width:100%;font-size:8px;color:#64748b;'
                'padding:0 16mm;text-align:center;font-family:"Times New Roman",Times,serif;">'
                '<span class="pageNumber"></span> / <span class="totalPages"></span>'
                "</div>"
            ),
        )
        browser.close()


def convert_with_xhtml2pdf(html: str, dst: Path) -> None:
    from xhtml2pdf import pisa

    dst.parent.mkdir(parents=True, exist_ok=True)
    with dst.open("wb") as out:
        status = pisa.CreatePDF(html.encode("utf-8"), dest=out, encoding="utf-8")
    if status.err:
        raise RuntimeError(f"xhtml2pdf hata sayısı: {status.err}")


def convert_file(
    src: Path,
    dst: Path | None = None,
    *,
    engine: str = "playwright",
) -> Path:
    if not src.exists():
        raise FileNotFoundError(src)
    dst = dst or src.with_suffix(".pdf")
    md_text = src.read_text(encoding="utf-8")
    title = src.stem.replace("-", " ").title()
    html = md_to_html(md_text, title=title, src_name=src.stem)

    if engine == "playwright":
        try:
            convert_with_playwright(html, dst)
            return dst
        except Exception as exc:
            print(f"  Playwright başarısız ({exc}); xhtml2pdf deneniyor...", file=sys.stderr)
            convert_with_xhtml2pdf(html, dst)
            return dst

    convert_with_xhtml2pdf(html, dst)
    return dst


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Markdown dosyalarını PDF'e çevirir.")
    parser.add_argument("files", nargs="*", help="Markdown dosya yolları")
    parser.add_argument(
        "--engine",
        choices=("playwright", "xhtml2pdf"),
        default="playwright",
        help="PDF motoru (varsayılan: playwright)",
    )
    parser.add_argument(
        "--all-docs",
        action="store_true",
        help="Tüm ana dokümantasyon PDF'lerini yeniden üret",
    )
    args = parser.parse_args(argv)

    if args.all_docs:
        files = [
            ROOT / "docs/edumath-sunum.md",
            ROOT / "docs/doktora-sunum-anlatim.md",
            ROOT / "docs/sunum-juri.md",
            ROOT / "docs/ogretmen-kullanim-kilavuzu.md",
            ROOT / "docs/ogrenci-kullanim-kilavuzu.md",
            ROOT / "tez_taslak.md",
            ROOT / "docs/tik-raporu-emre-incekalan.md",
            ROOT / "docs/tez-gap-analizi-ve-literatur.md",
        ]
    elif args.files:
        files = [Path(f) if Path(f).is_absolute() else ROOT / f for f in args.files]
    else:
        parser.error("Dosya belirtin veya --all-docs kullanın.")
        return 2

    ok, fail = 0, 0
    for src in files:
        try:
            out = convert_file(src, engine=args.engine)
            print(f"OK  {out.relative_to(ROOT)}")
            ok += 1
        except Exception as exc:
            print(f"HATA {src}: {exc}", file=sys.stderr)
            fail += 1
    return 0 if fail == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
