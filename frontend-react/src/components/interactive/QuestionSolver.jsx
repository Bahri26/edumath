import React, { useState, useMemo } from 'react';
import MDEditor from '@uiw/react-md-editor';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

/**
 * Restored QuestionSolver
 * Lightweight renderer supporting expanded question types with safe fallbacks.
 * This is not full production interactivity yet; complex types degrade gracefully.
 */
const SIMPLE_TYPES = ['test','dogru-yanlis','bosluk-doldurma','coktan-secmeli-coklu'];
const MATCH_TYPES = ['eslestirme','surukle-birak','hafiza-karti','eslesmeyi-bul'];
const ORDER_TYPES = ['siralama','kelime-corbasi','grup-siralama','anagram'];
const VISUAL_TYPES = ['cizim','grafik-ciz','sayi-dogrusu','kesir-gorsel','geometri-cizim'];
const SPECIAL_TYPES = ['denklem-kur','carkifelek','kutu-ac','eslesme-oyunu','cumle-tamamla'];

const QuestionSolver = ({ questionData, question, onSolved, onClose }) => {
  const q = questionData || question || {};
  const type = (q.questionType || 'test').toLowerCase();
  const config = q.interactiveConfig || {};

  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('idle'); // idle | correct | wrong
  const [revealed, setRevealed] = useState(0);
  const startTime = useMemo(() => Date.now(), []);

  // Hints parse
  const hints = useMemo(() => {
    const raw = (q.solutionText || '').trim();
    if (!raw) return [];
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) return lines;
    return raw.split(/[.!?]\s+/).map(l => l.trim()).filter(Boolean);
  }, [q.solutionText]);

  const normalize = v => String(v || '').trim().toLowerCase();

  const check = () => {
    // Basic correctness only for simple types; complex types marked correct if answered.
    let correct = false;
    if (SIMPLE_TYPES.includes(type)) {
      correct = normalize(answer) === normalize(q.correctAnswer);
    } else {
      // Accept any non-empty interaction as provisional success (placeholder logic)
      correct = !!answer;
    }
    setStatus(correct ? 'correct' : 'wrong');
    onSolved && onSolved({ correct, userAnswer: answer, timeMs: Date.now() - startTime });
  };

  const reset = () => { setAnswer(''); setStatus('idle'); setRevealed(0); };
  const revealHint = () => setRevealed(r => Math.min(r+1, hints.length));

  // Render handlers
  const renderSimple = () => {
    if (type === 'dogru-yanlis') {
      return (
        <div className="solver-grid">
          {['Doğru','Yanlış'].map(opt => (
            <label key={opt} className="solver-option">
              <input type="radio" name="tf" value={opt} checked={answer===opt} onChange={e=>setAnswer(e.target.value)} /> {opt}
            </label>
          ))}
        </div>
      );
    }
    if (type === 'test' || type === 'coktan-secmeli-coklu' || Array.isArray(q.options)) {
      return (
        <div className="solver-grid">
          {(q.options||[]).map((opt,i) => (
            <label key={i} className="solver-option">
              <input type="radio" name="mc" value={opt} checked={answer===opt} onChange={e=>setAnswer(e.target.value)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );
    }
    // bosluk-doldurma
    return (
      <input
        className="solver-input"
        placeholder="Cevabınızı yazın"
        value={answer}
        onChange={e=>setAnswer(e.target.value)}
      />
    );
  };

  const renderPlaceholder = (title, details=[]) => (
    <div className="solver-placeholder">
      <strong>{title} (beta)</strong>
      <ul>
        {details.map((d,i)=>(<li key={i}>{d}</li>))}
      </ul>
      <textarea
        className="solver-textarea"
        placeholder="Öğrenci etkileşimi (geçici) — cevap giriniz"
        value={answer}
        onChange={e=>setAnswer(e.target.value)}
      />
      <small style={{opacity:.7}}>Tam interaktif bileşen henüz eklenmedi. Şimdilik metin girdisiyle test ediliyor.</small>
    </div>
  );

  const renderBody = () => {
    if (SIMPLE_TYPES.includes(type)) return renderSimple();
    if (MATCH_TYPES.includes(type)) return renderPlaceholder('Eşleştirme / Sürükle-Bırak', ['Sol & sağ öğeleri eşleştir.', 'Şimdilik metin cevabı giriniz.']);
    if (ORDER_TYPES.includes(type)) return renderPlaceholder('Sıralama / Anagram', ['Öğeleri doğru sıraya diz.', 'Şimdilik sırayı metin olarak yazın.']);
    if (VISUAL_TYPES.includes(type)) return renderPlaceholder('Görsel / Çizim', ['Çizim veya işaretleme gerekir.', 'Şimdilik açıklama giriniz.']);
    if (SPECIAL_TYPES.includes(type)) return renderPlaceholder('Özel İnteraktif', ['Oyun / dinamik mantık.', 'Şimdilik sonucu yazınız.']);
    return renderSimple();
  };

  return (
    <div className="solver-card" style={{maxWidth:900, margin:'0 auto'}}>
      <div className="solver-header">
        <div>
          <div className="solver-meta">{q.subject || ''} {q.classLevel ? `• ${q.classLevel}`:''} {q.topic?`• ${q.topic}`:''}</div>
          <h3 style={{margin:'4px 0'}}>Soruyu Çöz</h3>
        </div>
        {onClose && <button className="solver-btn" onClick={onClose}>Kapat</button>}
      </div>

      <div className="solver-question">
        <div style={{fontWeight:600, marginBottom:6}}>Soru</div>
        {q.text ? (
          <div data-color-mode="light">
            <MDEditor.Markdown source={q.text} rehypePlugins={[[rehypeKatex,{output:'mathml'}]]} remarkPlugins={[remarkMath]} />
          </div>
        ) : <div>Metin yok.</div>}
      </div>

      <div className="solver-body">{renderBody()}</div>

      <div className="solver-actions">
        <button className="solver-btn primary" disabled={!answer} onClick={check}>Kontrol Et</button>
        {hints.length>0 && <button className="solver-btn" disabled={revealed>=hints.length} onClick={revealHint}>İpucu ({revealed}/{hints.length})</button>}
        <button className="solver-btn" onClick={reset}>Sıfırla</button>
      </div>

      {status!=='idle' && (
        <div className={`solver-feedback ${status==='correct'?'ok':'no'}`}>
          {status==='correct' ? 'Doğru! 🎉' : 'Yanlış, tekrar dene 💪'}
        </div>
      )}

      {revealed>0 && (
        <div className="solver-hints">
          <div style={{fontWeight:600, marginBottom:4}}>İpuçları</div>
          <ol style={{margin:0, paddingLeft:20}}>
            {hints.slice(0, revealed).map((h,i)=>(
              <li key={i}>
                <div data-color-mode="light">
                  <MDEditor.Markdown source={h} rehypePlugins={[[rehypeKatex,{output:'mathml'}]]} remarkPlugins={[remarkMath]} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default QuestionSolver;

/* Minimal styles (scoped) */
// You can later move to a dedicated css file.
