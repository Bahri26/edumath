import React, { useMemo, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

/**
 * QuestionSolver
 * Lightweight, kid-themed question solving widget to replace SimulationPlayer for practice.
 *
 * Props:
 * - questionData | question: {
 *     questionType: 'test' | 'bosluk-doldurma' | 'true-false' | string,
 *     text: string,
 *     options?: string[],
 *     correctAnswer?: string,
 *     solutionText?: string, // optional: used to generate step-by-step hints
 *     subject?: string,
 *     classLevel?: string|number,
 *     topic?: string
 *   }
 * - onSolved?: (result: { correct: boolean; userAnswer: string; timeMs: number }) => void
 * - onClose?: () => void
 */
const QuestionSolver = ({ questionData, question, onSolved, onClose }) => {
  const q = questionData || question || {};
  const type = (q.questionType || 'test').toLowerCase();
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState('idle'); // idle | correct | wrong
  const [revealed, setRevealed] = useState(0);
  const [startedAt] = useState(() => Date.now());

  // Split solutionText into simple hint steps (sentences or lines)
  const steps = useMemo(() => {
    const raw = (q.solutionText || '').trim();
    if (!raw) return [];
    const byLine = raw
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (byLine.length > 1) return byLine;
    // fallback to sentences
    return raw
      .split(/[.!?]\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [q.solutionText]);

  const normalize = (val) => {
    if (val == null) return '';
    const s = String(val).trim();
    // Numeric tolerant compare support: convert 1,5 to 1.5
    const n = Number(s.replace(',', '.'));
    if (!Number.isNaN(n) && Number.isFinite(n)) return String(n);
    return s.toLowerCase();
  };

  const checkAnswer = () => {
    const user = normalize(selected);
    const correct = normalize(q.correctAnswer);

    let ok = false;
    if (user === correct) ok = true;
    else {
      // If both are numeric, allow tiny tolerance
      const un = Number(user), cn = Number(correct);
      if (!Number.isNaN(un) && !Number.isNaN(cn)) {
        ok = Math.abs(un - cn) < 1e-6;
      }
    }

    setStatus(ok ? 'correct' : 'wrong');
    if (onSolved) onSolved({ correct: ok, userAnswer: selected, timeMs: Date.now() - startedAt });
  };

  const revealHint = () => setRevealed((n) => Math.min(n + 1, steps.length));

  const reset = () => {
    setSelected('');
    setStatus('idle');
    setRevealed(0);
  };

  const renderBody = () => {
    if (type === 'dogru-yanlis' || type === 'true-false') {
      const opts = ['Doğru', 'Yanlış'];
      return (
        <div style={{ display: 'grid', gap: 8 }}>
          {opts.map((opt) => (
            <label key={opt} className="kids-card" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="radio"
                name="opt"
                value={opt}
                checked={selected === opt}
                onChange={(e) => setSelected(e.target.value)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );
    }
    if (type === 'test' || (Array.isArray(q.options) && q.options.length > 0)) {
      return (
        <div>
          <div style={{ display: 'grid', gap: 8 }}>
            {(q.options || []).map((opt, idx) => (
              <label key={idx} className="kids-card" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="opt"
                  value={opt}
                  checked={selected === opt}
                  onChange={(e) => setSelected(e.target.value)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    // default: short answer / fill-in
    return (
      <div className="kids-card" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          className="kids-input"
          placeholder="Cevabını yaz"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--kids-yellow, #f1c40f)' }}
        />
      </div>
    );
  };

  return (
    <div className="kids-card" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <div className="muted" style={{ fontSize: 12 }}>
            {q.subject ? `${q.subject} · ` : ''}{q.classLevel ? `${q.classLevel} · ` : ''}{q.topic || ''}
          </div>
          <h3 style={{ margin: 0 }}>Soruyu Çöz</h3>
        </div>
        {onClose && (
          <button className="kids-btn" onClick={onClose}>Kapat</button>
        )}
      </div>

      {/* Question text */}
      <div className="kids-card" style={{ background: 'var(--kids-blue-light, #ecf6ff)' }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Soru</div>
        {q.text ? (
          <div data-color-mode="dark">
            <MDEditor.Markdown
              source={q.text}
              rehypePlugins={[[rehypeKatex, { output: 'mathml' }]]}
              remarkPlugins={[remarkMath]}
            />
          </div>
        ) : (
          <div>Soru metni yok.</div>
        )}
      </div>

      {/* Answers */}
      <div style={{ marginTop: 10 }}>{renderBody()}</div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
        <button className="kids-btn primary" onClick={checkAnswer} disabled={!selected}>Kontrol Et</button>
        {steps.length > 0 && (
          <button className="kids-btn" onClick={revealHint} disabled={revealed >= steps.length}>İpucu</button>
        )}
        <button className="kids-btn" onClick={reset}>Sıfırla</button>
      </div>

      {/* Feedback */}
      {status !== 'idle' && (
        <div className="kids-card" style={{ marginTop: 10, background: status === 'correct' ? 'var(--kids-green, #2ecc71)' : 'var(--kids-yellow, #f1c40f)', color: status === 'correct' ? '#fff' : '#333' }}>
          {status === 'correct' ? 'Doğru! Aferin 🎉' : 'Yanlış, tekrar dene 💪'}
        </div>
      )}

      {/* Hints */}
      {revealed > 0 && (
        <div className="kids-card" style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>İpuçları</div>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {steps.slice(0, revealed).map((s, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                <div data-color-mode="dark">
                  <MDEditor.Markdown
                    source={s}
                    rehypePlugins={[[rehypeKatex, { output: 'mathml' }]]}
                    remarkPlugins={[remarkMath]}
                  />
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
