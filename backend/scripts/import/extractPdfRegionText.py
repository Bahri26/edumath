#!/usr/bin/env python3
"""Metin katmanlı PDF'lerden manifest bölgelerine göre soru metni çıkarır."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    import fitz
except ImportError:
    print("Gerekli: pip install pymupdf", file=sys.stderr)
    raise SystemExit(1)

OPTION_LINE_RE = re.compile(r"^\s*([A-Ea-e])\s*[\).:\-]\s*(.+)$", re.MULTILINE)
QUESTION_NUM_RE = re.compile(r"^\s*(\d{1,2})\s*[.)]\s*", re.MULTILINE)
ANSWER_KEY_RE = re.compile(r"^\d{1,2}\s*[-–]\s*[A-E]", re.MULTILINE | re.IGNORECASE)


def parse_inline_options(text: str) -> dict[str, str]:
    found: dict[str, str] = {}
    s = text or ""

    lead = re.match(r"^([\d.,+\-n°²\s]{1,50}?)\s+([B-E])\s*[\).:\-]", s, re.IGNORECASE)
    if lead:
        found["A"] = lead.group(1).strip()

    for m in re.finditer(r"\b([A-E])\s*[\).:\-]\s*", s, re.IGNORECASE):
        letter = m.group(1).upper()
        start = m.end()
        nxt = re.search(r"\b[A-E]\s*[\).:\-]\s*", s[start:], re.IGNORECASE)
        end = start + nxt.start() if nxt else len(s)
        val = s[start:end].strip()
        val = re.sub(r"[|¦©]+", "", val)
        val = re.sub(r"\s+", " ", val).strip()
        if val and letter not in found:
            found[letter] = val
    return found


def build_question_text(raw: str) -> str:
    lines = [ln.strip() for ln in (raw or "").splitlines() if ln.strip()]
    body: list[str] = []
    for line in lines:
        if OPTION_LINE_RE.match(line):
            break
        if ANSWER_KEY_RE.match(line):
            break
        if re.match(r"^(KTT|BTT|TEST|TEMA|KONU|SINIF|ORUNT)", line, re.I):
            continue
        body.append(QUESTION_NUM_RE.sub("", line).strip())
    return "\n".join(body).strip()


def extract_regions(manifest_path: Path, scale: float = 2.0) -> dict[int, dict]:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    pdf_path = Path(manifest["sourcePdf"])
    if not pdf_path.is_file():
        raise FileNotFoundError(f"PDF bulunamadı: {pdf_path}")

    doc = fitz.open(str(pdf_path))
    seq = 0
    out: dict[int, dict] = {}

    for page_meta in manifest.get("pages", []):
        page = doc[page_meta["page"] - 1]
        for reg in page_meta.get("regions", []):
            seq += 1
            y0 = reg["y0"] / scale
            y1 = reg["y1"] / scale
            clip = fitz.Rect(0, y0, page.rect.width, y1)
            text = (page.get_text("text", clip=clip) or "").strip()
            opts = parse_inline_options(text)
            for line in text.splitlines():
                m = OPTION_LINE_RE.match(line.strip())
                if m:
                    letter = m.group(1).upper()
                    if letter not in opts:
                        opts[letter] = m.group(2).strip()
            out[seq] = {
                "text": build_question_text(text) or text[:800],
                "fullText": text[:2500],
                "options": {k: opts.get(k, "") for k in "ABCDE"},
            }

    doc.close()
    return out


def main() -> None:
    if len(sys.argv) < 2:
        print("Kullanım: extractPdfRegionText.py <manifest.json>", file=sys.stderr)
        raise SystemExit(1)
    manifest_path = Path(sys.argv[1]).resolve()
    data = extract_regions(manifest_path)
    print(json.dumps(data, ensure_ascii=False))


if __name__ == "__main__":
    main()
