const fs = require('fs');
const path = require('path');
const { validatePack } = require('./extractedPatternPack');
const root = path.resolve(__dirname, '../../data/pattern-pdf-import');
const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cards = [];
for (const grade of [5,6,7,9]) {
  const data = JSON.parse(fs.readFileSync(path.join(root, `${grade}-sinif-extracted.json`), 'utf8'));
  validatePack(data,root,`${grade}-sinif`);
  for (const q of data.questions) {
    const answer = String.fromCharCode(65 + q.options.indexOf(q.correctAnswer));
    cards.push(`<article data-grade="${grade}"><header>${grade}. Sınıf · ${escape(q.testCode || 'Lise')} · Sayfa ${q.page} / Soru ${q.questionNumber}<span>${escape(q.difficulty)}</span></header><img loading="lazy" src="${escape(q.diagramFile)}" alt="${escape(q.text)}"><details><summary>Cevap ve çözüm: ${answer}</summary><p>${escape(q.correctAnswer)}</p><p>${escape(q.solution)}</p></details></article>`);
  }
}
const html = `<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>95 Örüntü Sorusu</title><style>body{margin:0;background:#f1f5f9;color:#172033;font:16px system-ui}main{max-width:1200px;margin:auto;padding:24px}h1{margin-bottom:8px}nav{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0}button{padding:10px 18px;border:1px solid #cbd5e1;border-radius:8px;background:white;cursor:pointer}button[aria-pressed=true]{background:#173f5f;color:white}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr));gap:20px}article{background:white;border-radius:12px;padding:18px;align-self:start;box-shadow:0 2px 8px #0001}header{font-weight:600;margin-bottom:14px}span{float:right;font-size:13px;color:#475569}img{width:100%;height:auto}details{margin-top:14px;border-top:1px solid #e2e8f0;padding-top:12px}summary{cursor:pointer;color:#17567a}p{white-space:pre-wrap;line-height:1.6}[hidden]{display:none}</style><main><h1>Örüntü Soru Bankası</h1><p>95 soru · Özgün görseller, ortak açıklamalar ve görsel şıklar korunmuştur.</p><nav>${['Tümü',5,6,7,9].map(g=>`<button aria-pressed="${g==='Tümü'}" data-filter="${g}">${g==='Tümü'?'Tümü':g+'. Sınıf'}</button>`).join('')}</nav><section>${cards.join('\n')}</section></main><script>document.querySelectorAll('button').forEach(b=>b.onclick=()=>{document.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));document.querySelectorAll('article').forEach(c=>c.hidden=b.dataset.filter!=='Tümü'&&c.dataset.grade!==b.dataset.filter);});</script></html>`;
const target = path.join(root,'preview.html');
fs.writeFileSync(target,html);
console.log(target);
