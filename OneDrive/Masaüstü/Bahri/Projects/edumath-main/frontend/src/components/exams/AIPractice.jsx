import React, { useState } from 'react';
import { Brain, CheckCircle, X } from 'lucide-react';

// This component handles the display and interaction of AI-generated practice questions.
const AIPractice = ({ questions }) => {
  const [practiceState, setPracticeState] = useState({});

  const handlePracticeAnswer = (qIndex, optionKey, correctOption) => {
    setPracticeState(prev => ({
      ...prev,
      [qIndex]: {
        selected: optionKey,
        isCorrect: optionKey === correctOption
      }
    }));
  };

  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className="animate-slide-up mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
          <Brain size={28} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Sana Özel Antrenman</h3>
          <p className="text-slate-500">Gemini AI tarafından eksiklerine göre hazırlandı.</p>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const state = practiceState[idx];
          const isAnswered = !!state;

          // Normalize options to handle both array and object formats from the backend
          const optionsArray = Array.isArray(q.options) ? q.options : Object.values(q.options);
          const optionsAreObjects = !Array.isArray(q.options); // Check if options are like { A: 'text', B: 'text' }

          return (
            <div key={idx} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 transition-all ${isAnswered ? (state.isCorrect ? 'border-green-200' : 'border-red-200') : 'border-transparent shadow-sm'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-lg text-sm">Soru {idx + 1}</span>
              </div>
              
              <p className="text-lg font-medium text-slate-800 dark:text-white mb-6">{q.text || q.questionText}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {optionsArray.map((opt, i) => {
                  const optKey = Object.keys(q.options)[i] || String(i); // 'A', 'B', etc. if object, or index if array
                  const valueToCompare = optionsAreObjects ? optKey : opt;
                  const isSelected = state?.selected === valueToCompare;
                  
                  let btnClass = "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"; // Default
                  if (isAnswered) {
                    if (q.correctAnswer === valueToCompare) btnClass = "bg-green-100 border-green-500 text-green-800"; // Correct option
                    else if (isSelected) btnClass = "bg-red-100 border-red-500 text-red-800"; // Incorrect selection
                    else btnClass = "opacity-50"; // Others
                  } else if (isSelected) {
                      btnClass = "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20";
                  }

                  return (
                    <button 
                      key={i} 
                      disabled={isAnswered}
                      onClick={() => handlePracticeAnswer(idx, valueToCompare, q.correctAnswer)}
                      className={`p-4 border rounded-xl text-left transition-all ${btnClass}`}
                    >
                      <span className="font-bold mr-2">{optKey})</span> {opt}
                    </button>
                  )
                })}
              </div>

              {isAnswered && (
                <div className={`mt-4 p-4 rounded-xl text-sm ${state.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <div className="font-bold mb-1 flex items-center gap-2">
                      {state.isCorrect ? <CheckCircle size={16}/> : <X size={16}/>}
                      {state.isCorrect ? "Doğru Cevap!" : "Yanlış Cevap"}
                  </div>
                  <p><strong>Çözüm:</strong> {q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIPractice;
