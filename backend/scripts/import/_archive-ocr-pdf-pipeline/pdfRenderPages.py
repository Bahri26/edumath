#!/usr/bin/env python3
"""
PDF sayfalarını PNG olarak render eder; soru bölme koordinatlarını ve cevap anahtarını çıkarır.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
    import numpy as np
    from PIL import Image
except ImportError as exc:
    print("Gerekli: pip install pymupdf pillow numpy", file=sys.stderr)
    raise SystemExit(1) from exc


def extract_answer_keys(text: str) -> dict[int, str]:
    keys: dict[int, str] = {}
    for m in re.finditer(r"(\d{1,2})\s*[-–]\s*([A-Ea-e])", text or ""):
        keys[int(m.group(1))] = m.group(2).upper()
    return keys


def extract_question_anchors_from_text(page, scale: float) -> list[float]:
    """Metin katmanındaki '1.' '2.' satırlarının y koordinatları (piksel, render ölçeğinde)."""
    anchors: list[tuple[int, float]] = []
    data = page.get_text("dict")
    for block in data.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            line_text = "".join(span.get("text", "") for span in line.get("spans", [])).strip()
            m = re.match(r"^(\d{1,2})\s*[.)]\s*$", line_text)
            if not m:
                m = re.match(r"^(\d{1,2})\s*[.)]\s+", line_text)
            if not m:
                continue
            num = int(m.group(1))
            if num < 1 or num > 40:
                continue
            y = line["bbox"][1] * scale
            anchors.append((num, y))

    anchors.sort(key=lambda x: x[1])
    dedup: list[float] = []
    seen: set[int] = set()
    for num, y in anchors:
        if num in seen:
            continue
        seen.add(num)
        dedup.append(y)
    return dedup


def find_gap_splits(image_path: Path, expected_count: int) -> list[float]:
    """Satır mürekkep yoğunluğundaki boşluklardan soru sınırı y koordinatları."""
    img = Image.open(image_path).convert("L")
    arr = np.array(img, dtype=np.float32)
    h, _w = arr.shape
    ink = (255.0 - arr).mean(axis=1) / 255.0

    window = 9
    smoothed = np.copy(ink)
    for i in range(h):
        lo = max(0, i - window // 2)
        hi = min(h, i + window // 2 + 1)
        smoothed[i] = ink[lo:hi].mean()

    header = int(h * 0.08)
    footer = int(h * 0.06)
    threshold = 0.028
    min_gap = max(8, int(h * 0.012))

    gaps: list[tuple[float, int, float]] = []
    in_gap = False
    gap_start = 0
    for y in range(header, h - footer):
        if smoothed[y] < threshold:
            if not in_gap:
                gap_start = y
                in_gap = True
        elif in_gap:
            gap_len = y - gap_start
            if gap_len >= min_gap:
                center = (gap_start + y) / 2
                score = gap_len * (1.0 - smoothed[gap_start:y].mean())
                gaps.append((score, gap_len, center))
            in_gap = False

    gaps.sort(reverse=True)
    needed = max(0, expected_count - 1)
    min_dist = (h - header - footer) / max(expected_count * 1.15, 2)
    chosen: list[float] = []
    for _score, _gap_len, center in gaps:
        if all(abs(center - c) >= min_dist for c in chosen):
            chosen.append(center)
        if len(chosen) >= needed:
            break
    chosen.sort()
    return chosen


def anchors_are_usable(anchors: list[float], page_height: int, expected_count: int) -> bool:
    if len(anchors) < expected_count:
        return False
    usable = anchors[:expected_count]
    span = usable[-1] - usable[0]
    if span < page_height * 0.22:
        return False
    # Üstte kümelenmiş numara listesi (9. sınıf PDF) — gerçek soru gövdesi değil
    top_cluster = sum(1 for y in usable if y < page_height * 0.22)
    if top_cluster >= expected_count - 1:
        return False
    min_band = min(
        usable[i + 1] - usable[i] for i in range(len(usable) - 1)
    ) if len(usable) > 1 else span
    return min_band > page_height * 0.06


def build_regions_equal(page_height: int, expected_count: int, header_ratio: float = 0.12, footer_ratio: float = 0.09) -> list[dict]:
    header = page_height * header_ratio
    footer = page_height * footer_ratio
    content_bottom = page_height - footer
    step = (content_bottom - header) / expected_count
    regions = []
    for i in range(expected_count):
        y0 = header + step * i
        y1 = header + step * (i + 1) - 2
        regions.append({"index": i + 1, "y0": round(y0, 1), "y1": round(y1, 1)})
    return regions


def build_regions_from_anchors(page_height: int, anchors: list[float], expected_count: int) -> list[dict]:
    footer = page_height * 0.06
    content_bottom = page_height - footer
    starts = anchors[:expected_count]
    regions = []
    for i, y0 in enumerate(starts):
        y1 = starts[i + 1] - 4 if i + 1 < len(starts) else content_bottom
        regions.append({
            "index": i + 1,
            "y0": round(max(0, y0 - 6), 1),
            "y1": round(min(content_bottom, y1), 1),
        })
    return regions


def build_regions_from_gaps(page_height: int, gap_centers: list[float], expected_count: int) -> list[dict]:
    header = page_height * 0.10
    footer = page_height * 0.08
    content_bottom = page_height - footer
    splits = sorted(gap_centers[: max(0, expected_count - 1)])
    bounds = [header, *splits, content_bottom]
    regions = []
    for i in range(expected_count):
        y0 = bounds[i]
        y1 = bounds[i + 1] - 2
        regions.append({"index": i + 1, "y0": round(y0, 1), "y1": round(y1, 1)})
    return regions


def render_pdf(pdf_path: Path, out_dir: Path, scale: float, page_splits: dict[str, list[int]]) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(str(pdf_path))
    slug = out_dir.name
    splits_cfg = page_splits.get(slug, [])
    pages_meta = []
    all_keys: dict[int, str] = {}

    for i in range(doc.page_count):
        page = doc[i]
        text = page.get_text() or ""
        keys = extract_answer_keys(text)
        all_keys.update(keys)

        expected = splits_cfg[i] if i < len(splits_cfg) else 4
        pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale))
        rel_name = f"page-{i + 1:02d}.png"
        abs_path = out_dir / rel_name
        pix.save(str(abs_path))

        prof = PAGE_PROFILES.get(out_dir.name, {"header": 0.10, "footer": 0.08})
        gap_splits = find_gap_splits(abs_path, expected)
        if len(gap_splits) >= max(1, expected - 1):
            regions = build_regions_from_gaps(pix.height, gap_splits, expected)
            region_method = "ink-gaps"
        else:
            regions = build_regions_equal(
                pix.height,
                expected,
                header_ratio=prof["header"],
                footer_ratio=prof["footer"],
            )
            region_method = "equal-split"
        anchors = extract_question_anchors_from_text(page, scale)

        pages_meta.append(
            {
                "page": i + 1,
                "image": rel_name,
                "width": pix.width,
                "height": pix.height,
                "expectedQuestions": expected,
                "regions": regions,
                "answerKeys": {str(k): v for k, v in sorted(keys.items())},
                "hasTextLayer": bool(text.strip()),
                "anchorCount": len(anchors),
                "regionMethod": region_method,
            }
        )

    doc.close()

    manifest = {
        "sourcePdf": str(pdf_path),
        "pageCount": len(pages_meta),
        "pages": pages_meta,
        "answerKeys": {str(k): v for k, v in sorted(all_keys.items())},
    }
    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


PAGE_SPLITS = {
    "5-sinif": [4, 4, 4, 4, 3, 2],
    "6-sinif": [3, 3, 3, 3, 3, 2, 2, 2],
    "7-sinif": [4, 4, 4, 4, 3, 2],
    "9-sinif": [4, 4, 4, 4, 4, 1],
}

PAGE_PROFILES = {
    "5-sinif": {"header": 0.095, "footer": 0.065},
    "6-sinif": {"header": 0.095, "footer": 0.065},
    "7-sinif": {"header": 0.095, "footer": 0.065},
    "9-sinif": {"header": 0.135, "footer": 0.095},
}


def main() -> None:
    parser = argparse.ArgumentParser(description="PDF sayfalarını PNG + manifest olarak çıkar")
    parser.add_argument("--pdf", required=True, help="Kaynak PDF yolu")
    parser.add_argument("--out", required=True, help="Çıktı klasörü")
    parser.add_argument("--scale", type=float, default=2.0, help="Render ölçeği")
    args = parser.parse_args()

    pdf_path = Path(args.pdf).expanduser().resolve()
    out_dir = Path(args.out).resolve()
    if not pdf_path.is_file():
        print(f"PDF bulunamadı: {pdf_path}", file=sys.stderr)
        raise SystemExit(1)

    manifest = render_pdf(pdf_path, out_dir, scale=args.scale, page_splits=PAGE_SPLITS)
    print(json.dumps({
        "ok": True,
        "out": str(out_dir),
        "pages": manifest["pageCount"],
        "answerKeys": len(manifest["answerKeys"]),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
