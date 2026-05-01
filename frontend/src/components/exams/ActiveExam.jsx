import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import apiClient from '../../services/api';
import QuestionVisual from '../questions/QuestionVisual.jsx';
import { MatchingPracticeCard, SequencePracticeCard } from './InteractivePracticeCards.jsx';

const optionLabel = (opt) => {
  if (opt == null) return '';
  if (typeof opt === 'object') return String(opt.text ?? '');
  return String(opt);
};

const ActiveExam = ({ exam, onFinish }) => {
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const timerRef = useRef(null);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getTimerColor = () => {
    if (timeLeft < 300) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    if (timeLeft < 600) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
    return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
  };

  const finishExam = async (currentAnswers) => {
    if (!exam) return;
    clearInterval(timerRef.current);
    
    try {
      const res = await apiClient.post(`/exams/${exam._id}/submit`, {
        studentName: 'Öğrenci', 
        answers: currentAnswers
      });
      onFinish(res.data);
    } catch {
      alert("Sınav gönderilirken hata oluştu.");
    }
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          finishExam(userAnswers); 
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [exam._id]);

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers(prev => ({...prev, [questionId]: answer}));
  };

  const answeredCount = useMemo(() => {
    if (!exam?.questions?.length) return 0;
    let n = 0;
    for (const q of exam.questions) {
      const stored = userAnswers[q._id];
      if (!stored) continue;
      if (q.type === 'matching') {
        try {
          const obj = typeof stored === 'string' ? JSON.parse(stored) : stored;
          const prompts = q.interactionData?.prompts || [];
          if (obj && prompts.length && prompts.every((p) => obj[p.id])) n += 1;
        } catch {
          /* ignore */
        }
        continue;
      }
      if (q.type === 'sequence') {
        try {
          const obj = typeof stored === 'string' ? JSON.parse(stored) : stored;
          if (obj && obj.locked && Array.isArray(obj.order)) n += 1;
        } catch {
          /* ignore */
        }
        continue;
      }
      n += 1;
    }
    return n;
  }, [exam?.questions, userAnswers]);

  const progress = Math.round((answeredCount / exam.questions.length) * 100);

  const isQuestionMarkedAnswered = (q) => {
    const stored = userAnswers[q._id];
    if (!stored) return false;
    if (q.type === 'matching') {
      try {
        const obj = typeof stored === 'string' ? JSON.parse(stored) : stored;
        const prompts = q.interactionData?.prompts || [];
        return !!(obj && prompts.length && prompts.every((p) => obj[p.id]));
      } catch {
        return false;
      }
    }
    if (q.type === 'sequence') {
      try {
        const obj = typeof stored === 'string' ? JSON.parse(stored) : stored;
        return !!(obj && obj.locked && Array.isArray(obj.order));
      } catch {
        return false;
      }
    }
    return true;
  };

  const handleMatchingExam = (questionId, promptId, selectedValue) => {
    setUserAnswers((prev) => {
      const prevRaw = prev[questionId];
      let selected = {};
      try {
        selected = prevRaw ? (typeof prevRaw === 'string' ? JSON.parse(prevRaw) : prevRaw) : {};
      } catch {
        selected = {};
      }
      selected = { ...selected, [promptId]: selectedValue };
      return { ...prev, [questionId]: JSON.stringify(selected) };
    });
  };

  const handleSequenceExam = (questionId, index, direction, currentOrder, checkOnly = false) => {
    setUserAnswers((prev) => {
      const prevRaw = prev[questionId];
      let parsed = null;
      try {
        parsed = prevRaw ? (typeof prevRaw === 'string' ? JSON.parse(prevRaw) : prevRaw) : null;
      } catch {
        parsed = null;
      }
      const baseOrder = Array.isArray(parsed?.order) ? [...parsed.order] : [...currentOrder];
      let nextOrder = [...baseOrder];
      if (!checkOnly) {
        const swapIndex = index + direction;
        if (swapIndex < 0 || swapIndex >= nextOrder.length) {
          return prev;
        }
        [nextOrder[index], nextOrder[swapIndex]] = [nextOrder[swapIndex], nextOrder[index]];
        return { ...prev, [questionId]: JSON.stringify({ order: nextOrder, locked: false }) };
      }
      return { ...prev, [questionId]: JSON.stringify({ order: nextOrder, locked: true }) };
    });
  };

  const currentQ = exam.questions[currentQuestion];
  const mcOptions = Array.isArray(currentQ?.options) ? currentQ.options : [];

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{exam.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {answeredCount} / {exam.questions.length} Soru Cevaplandı
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl font-mono font-bold text-lg ${getTimerColor()}`}>
              <Clock size={20} />
              {formatTime(timeLeft)}
            </div>
            <button 
              onClick={() => finishExam(userAnswers)} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg"
            >
              Teslim Et
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-100 dark:bg-slate-700 h-1">
          <div 
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
        {/* Question Navigation */}
        <div className="mb-8 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
          {exam.questions.map((q, idx) => (
            <button
              key={q._id}
              onClick={() => setCurrentQuestion(idx)}
              className={`h-10 rounded-lg font-bold text-sm transition-all ${
                currentQuestion === idx
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 dark:ring-indigo-500'
                  : isQuestionMarkedAnswered(q)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {/* Current Question */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
          {/* Question Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <span className="inline-block bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold px-3 py-1 rounded-lg mb-3">
                Soru {currentQuestion + 1} / {exam.questions.length}
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{exam.questions[currentQuestion].text}</h3>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white whitespace-nowrap ${
              currentQ.difficulty === 'Zor' 
                ? 'bg-red-500' 
                : currentQ.difficulty === 'Orta' 
                ? 'bg-amber-500' 
                : 'bg-emerald-500'
            }`}>
              {currentQ.difficulty}
            </span>
          </div>

          {currentQ.image && (
            <div className="mb-6">
              <QuestionVisual src={currentQ.image} alt="Soru görseli" className="w-full max-h-72 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
          )}

          {/* Options */}
          {currentQ.type === 'matching' ? (
            <MatchingPracticeCard
              examMode
              question={currentQ}
              state={(() => {
                try {
                  const raw = userAnswers[currentQ._id];
                  const obj = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {};
                  return { selected: obj || {} };
                } catch {
                  return { selected: {} };
                }
              })()}
              onChange={(promptId, value) => handleMatchingExam(currentQ._id, promptId, value)}
            />
          ) : currentQ.type === 'sequence' ? (
            <SequencePracticeCard
              examMode
              question={currentQ}
              state={(() => {
                try {
                  const raw = userAnswers[currentQ._id];
                  const obj = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
                  if (obj && Array.isArray(obj.order)) {
                    return { selected: obj.order, checked: !!obj.locked };
                  }
                } catch {
                  /* ignore */
                }
                return undefined;
              })()}
              onMove={(index, direction, ord, checkOnly) => handleSequenceExam(currentQ._id, index, direction, ord, checkOnly)}
            />
          ) : (
            <div className="space-y-3">
              {mcOptions.map((opt, i) => {
                const label = optionLabel(opt);
                return (
                  <label
                    key={i}
                    className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      userAnswers[currentQ._id] === label
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 dark:border-indigo-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQ._id}`}
                      value={label}
                      checked={userAnswers[currentQ._id] === label}
                      onChange={() => handleAnswerChange(currentQ._id, label)}
                      className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0"
                    />
                    <span className="text-slate-700 dark:text-slate-200 font-medium">{label}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4 mt-8">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            ← Önceki
          </button>
          
          <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            {answeredCount} cevaplandı
          </div>
          
          <button
            onClick={() => setCurrentQuestion(Math.min(exam.questions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === exam.questions.length - 1}
            className="px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Sonraki →
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
          <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Cevapladığınız soruların numaraları yeşil, cevaplamadığınız soruların numaraları gri renkle gösterilmektedir.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActiveExam;
