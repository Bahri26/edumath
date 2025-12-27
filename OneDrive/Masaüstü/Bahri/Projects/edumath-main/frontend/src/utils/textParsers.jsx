import React from 'react';

export function renderWithLatex(text) {
  if (!text) return null;
  const stringText = String(text);
  const parts = stringText.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const pureMath = part.slice(1, -1);
          return <span key={index} className="text-indigo-600 font-serif">{pureMath}</span>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

// Smart LaTeX question parser
export function parseQuestionText(text) {
  try {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
    let questionText = '';
    let latexFormula = '';
    const firstLine = lines[0] || '';
    const latexMatch = firstLine.match(/\$\$(.*?)\$\$/);
    if (latexMatch) {
      latexFormula = latexMatch[1];
      questionText = firstLine.replace(/\$\$.*?\$\$/, '').trim();
      if (lines[1] && !lines[1].match(/^[A-D]\)/)) {
        questionText += ' ' + lines[1];
      }
    } else {
      questionText = firstLine;
      if (lines[1] && !lines[1].match(/^[A-D]\)/)) {
        questionText += ' ' + lines[1];
      }
    }
    const options = [];
    let correctAnswerLetter = '';
    let solution = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const optionMatch = line.match(/^([A-D])\)\s*(.+)/);
      if (optionMatch) {
        options.push({ text: optionMatch[2].trim() });
      }
      if (line.startsWith('Çözüm:') || line.startsWith('Cozum:')) {
        solution = line.replace(/^(Çözüm|Cozum):\s*/i, '').trim();
      }
      if (line.match(/Doğru Şık:|Dogru Sik:|Cevap:/i)) {
        const answerMatch = line.match(/([A-D])/);
        if (answerMatch) {
          correctAnswerLetter = answerMatch[1];
        }
      }
    }
    const correctAnswerIndex = correctAnswerLetter ? correctAnswerLetter.charCodeAt(0) - 65 : -1;
    const finalQuestionText = latexFormula ? `$${latexFormula}$ ${questionText}` : questionText;
    return {
      text: finalQuestionText,
      type: 'multiple-choice',
      options: options.map((opt, idx) => ({
        ...opt,
        isCorrect: idx === correctAnswerIndex,
      })),
      solution,
    };
  } catch (e) {
    return null;
  }
}
