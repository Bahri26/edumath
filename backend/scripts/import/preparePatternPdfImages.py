"""Render the complete 95-question source pack, including shared stems and visual options.

Requires Pillow and Poppler (pdftoppm on PATH). Never uses OCR or modifies PDFs.
Usage: python preparePatternPdfImages.py --pdf-dir <source folder>
"""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2] / 'data' / 'pattern-pdf-import'

# Normalized page rectangles, in source question order. Headers and answer keys excluded.
L, R, F = (.03, .50), (.51, .98), (.03, .98)

def column(bounds, spans):
    return [(bounds[0], top, bounds[1], bottom) for top, bottom in spans]

LAYOUTS = {
    5: {
        1: column(L, [(.082,.26),(.385,.49),(.625,.86)]) + column(R, [(.082,.27),(.385,.505),(.625,.80)]),
        2: column(L, [(.082,.32),(.415,.53),(.62,.86)]) + column(R, [(.082,.33),(.415,.62),(.695,.86)]),
        3: column(L, [(.09,.25)]) + column(R, [(.09,.26)]) + column(F, [(.515,.77)]),
        4: column(F, [(.39,.46),(.57,.64),(.765,.825)]),
        5: column(F, [(.075,.46),(.535,.81)]),
        6: column(F, [(.075,.375),(.485,.74)]),
    },
    6: {
        1: column(L, [(.085,.295),(.40,.51),(.635,.89)]) + column(R, [(.08,.315),(.475,.89)]),
        2: column(L, [(.08,.245),(.34,.52),(.615,.815)]) + column(R, [(.08,.24),(.34,.575),(.615,.885)]),
        3: column(F, [(.385,.48),(.575,.665),(.765,.85)]),
        4: column(L, [(.085,.155),(.30,.615),(.715,.86)]) + column(R, [(.085,.245),(.30,.61),(.715,.89)]),
        5: column(L, [(.085,.25)]) + column(R, [(.085,.25)]) + column(F, [(.52,.80)]),
        6: column(L, [(.085,.415)]) + column(R, [(.085,.415)]) + column(F, [(.49,.84)]),
        7: column(F, [(.09,.34),(.51,.89)]),
        8: column(F, [(.09,.34),(.51,.83)]),
    },
    7: {
        1: column(L, [(.08,.245),(.355,.505),(.665,.835)]) + column(R, [(.08,.245),(.355,.51),(.665,.835)]),
        2: column(L, [(.08,.18),(.35,.595),(.66,.835)]) + column(R, [(.08,.28),(.35,.60),(.66,.85)]),
        3: column(L, [(.085,.345)]) + column(R, [(.085,.345)]) + column(F, [(.48,.84)]),
        4: column(L, [(.085,.345)]) + column(R, [(.085,.345)]) + column(F, [(.485,.835)]),
        5: column(F, [(.085,.345),(.49,.80)]),
        6: column(F, [(.085,.325),(.49,.815)]),
    },
    9: {
        1: column(L, [(.165,.49),(.635,.855)]) + column(R, [(.165,.375),(.535,.68)]),
        2: column(L, [(.115,.44),(.57,.815)]) + column(R, [(.115,.435),(.535,.815)]),
        3: column(L, [(.115,.41),(.555,.81)]) + column(R, [(.115,.405),(.555,.82)]),
        4: column(L, [(.115,.435),(.535,.855)]) + column(R, [(.115,.435),(.535,.855)]),
        5: column(L, [(.115,.42),(.535,.85)]) + column(R, [(.115,.42),(.535,.86)]),
        6: column(L, [(.115,.47)]),
    },
}

def crop(page, rect):
    w, h = page.size
    return page.crop(tuple(round(v * (w if i % 2 == 0 else h)) for i, v in enumerate(rect)))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pdf-dir', type=Path, required=True)
    args = parser.parse_args()
    for grade, pages in LAYOUTS.items():
        file = ROOT / f'{grade}-sinif-extracted.json'
        data = json.loads(file.read_text(encoding='utf-8'))
        temp_root = ROOT.parents[1] / 'tmp' / 'pattern-pdf-render'
        temp_root.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=temp_root) as temp:
            prefix = Path(temp) / 'page'
            subprocess.run(['pdftoppm', '-scale-to', '2400', '-png',
                            str(args.pdf_dir / data['source']['pdfName']), str(prefix)], check=True)
            images = sorted(Path(temp).glob('page-*.png'))
            for page_number, rects in pages.items():
                questions = sorted((q for q in data['questions'] if q['page'] == page_number),
                                   key=lambda q: q['questionNumber'])
                if len(questions) != len(rects):
                    raise ValueError(f'{grade}, page {page_number}: count mismatch')
                with Image.open(images[page_number - 1]) as page:
                    for q, rect in zip(questions, rects):
                        rect = (rect[0], max(.075,rect[1]-.025), rect[2], min(.91,rect[3]+.045))
                        overrides = {
                            (6,2,10): (.51,.315,.98,.59),
                            (6,3,3): (.03,.715,.98,.885),
                            (7,2,8): (.06,.305,.51,.60),
                            (7,2,10): (.52,.075,.98,.295),
                            (7,2,11): (.52,.305,.98,.60),
                            (9,3,10): (.03,.485,.50,.86),
                            (9,3,12): (.51,.49,.98,.865),
                            (9,5,17): (.03,.09,.50,.425),
                            (9,5,18): (.03,.44,.50,.865),
                        }
                        if grade == 7 and rect[2] <= .50:
                            rect = (.06, rect[1], .51, rect[3])
                        if (grade,page_number) == (7,4):
                            rect = (rect[0],rect[1],.52,rect[3]) if q['questionNumber']==4 else (
                                (.53,rect[1],rect[2],rect[3]) if q['questionNumber']==5 else rect)
                        if (grade,page_number) == (5,2) and q['questionNumber'] >= 10:
                            rect = (.49,rect[1],rect[2],rect[3])
                        rect = overrides.get((grade,page_number,q['questionNumber']), rect)
                        parts = []
                        if (grade, page_number) in [(5,4),(6,3)]:
                            parts.append(crop(page, (.07,.085,.96,.325)))
                        parts.append(crop(page, rect))
                        canvas = Image.new('RGB', (max(p.width for p in parts),
                                                  sum(p.height for p in parts) + 20 * (len(parts)-1)), 'white')
                        y = 0
                        for part in parts:
                            canvas.paste(part, (0,y))
                            y += part.height + 20
                        relative = f'{grade}-sinif/source-p{page_number:02}-q{q["questionNumber"]:02}.png'
                        target = ROOT / relative
                        target.parent.mkdir(parents=True, exist_ok=True)
                        canvas.save(target, optimize=True)
                        q.update(hasVisual=True, diagramFile=relative, imageRole='full-question',
                                 sourceCrop=list(rect))
        file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'{grade}: {len(data["questions"])} source question images')

if __name__ == '__main__':
    main()
