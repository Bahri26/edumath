import React, { useState, useEffect, useContext } from 'react';
import {
  Loader2, BookOpen, Play, Lock, CheckCircle2, Clock, Zap, AlertCircle, ChevronRight
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { LanguageContext } from '../../context/LanguageContext';

// --- Difficulty Color Badge ---
const DifficultyBadge = (level) => {
  const colors = {
    'Kolay': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    'Orta': 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    'Zor': 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
  };
  return colors[level] || colors['Orta'];
};

// --- Exercise Card ---
const ExerciseCard = ({ exercise, onStart, isCompleted }) => {
  const totalQuestions = exercise.questions?.length || 0;
  const submission = exercise.submissions?.[0];

  return (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl border transition-all ${
      isCompleted
        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30'
        : 'border-slate-200 dark:border-slate-700 hover:shadow-lg'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
            {exercise.name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{exercise.description}</p>
        </div>
        {isCompleted && (
          <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" size={24} />
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
          {totalQuestions} soru
        </span>
        {exercise.difficulty?.map(d => (
          <span key={d} className={`px-3 py-1 text-xs font-bold border rounded-lg ${DifficultyBadge(d)}`}>
            {d}
          </span>
        ))}
        {exercise.gameMode === 'timed' && (
          <span className="px-3 py-1 text-xs font-bold flex items-center gap-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
            <Clock size={14} /> {exercise.timeLimit} dk
          </span>
        )}
        {exercise.gameMode === 'challenge' && (
          <span className="px-3 py-1 text-xs font-bold flex items-center gap-1 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
            <Zap size={14} /> Puanla
          </span>
        )}
      </div>

      {/* Progress & Score */}
      {submission && (
        <div className="mb-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            <strong>Skor:</strong> {submission.score}/{totalQuestions * 10} puan
            {submission.status === 'completed' && (
              <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                ✓ Tamamlandı
              </span>
            )}
          </p>
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={() => onStart(exercise)}
        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
          isCompleted
            ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
        }`}
      >
        <Play size={18} /> {submission ? 'Tekrar Başla' : 'Başla'}
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

// ============================================
// ANA COMPONENT
// ============================================

export default function StudentPracticeExercises() {
  const { showToast } = useToast();
  const { language } = useContext(LanguageContext);

  // --- DİL ÇEVIRILERI ---
  const t = {
    TR: {
      funExercises: "Eğlenceli Egzersizler",
      subtitle: "AI ile hazırlanmış egzersizleri tamamlayın ve başarılı olun.",
      questions: "soru",
      start: "Başla",
      back: "Geri Dön",
      close: "Kapat",
      tryAgain: "Tekrar Başla",
      loading: "Yükleniyor...",
      noExercises: "Henüz egzersiz yok",
      submitAnswers: "Cevapları Gönder",
      answerAll: "Tüm soruları cevapla",
      completed: "✓ Tamamlandı",
    },
    EN: {
      funExercises: "Fun Exercises",
      subtitle: "Complete AI-prepared exercises and succeed.",
      questions: "questions",
      start: "Start",
      back: "Go Back",
      close: "Close",
      tryAgain: "Try Again",
      loading: "Loading...",
      noExercises: "No exercises yet",
      submitAnswers: "Submit Answers",
      answerAll: "Answer all questions",
      completed: "✓ Completed",
    }
  };

  const getText = (key) => t[language]?.[key] || t.TR[key];
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseAnswers, setExerciseAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);

  // ---- Fetch Exercises ----
  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/exercises/student/my-exercises');
        if (res.data.data) {
          setExercises(res.data.data);
        }
      } catch (err) {
        showToast('Egzersizler yüklenemedi', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []);

  // ---- Start Exercise ----
  const handleStartExercise = (exercise) => {
    setSelectedExercise(exercise);
    setExerciseAnswers({});
    setShowResults(false);
  };

  // ---- Submit Answers ----
  const handleSubmitAnswers = async () => {
    if (!selectedExercise) return;

    if (Object.keys(exerciseAnswers).length !== selectedExercise.questions?.length) {
      showToast(getText('answerAll'), 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post(`/exercises/${selectedExercise._id}/submit`, {
        answers: exerciseAnswers
      });

      setResults(res.data.data);
      setShowResults(true);
      showToast('✨ Tamamlandı! Sonuçlarınız yüklendi.', 'success');
      
      // Refresh exercises list
      const refreshRes = await apiClient.get('/exercises/student/my-exercises');
      if (refreshRes.data.data) {
        setExercises(refreshRes.data.data);
      }
    } catch (err) {
      showToast('Cevaplar gönderilemedi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- If exercise selected, show player ----
  if (selectedExercise) {
    return (
      <div className="flex-1 p-6 space-y-6 pb-20">
        
        {/* Header */}
        <button
          onClick={() => setSelectedExercise(null)}
          className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline"
        >
          ← {getText('back')}
        </button>

        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            {selectedExercise.name}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">{selectedExercise.description}</p>
        </div>

        {/* Timer */}
        {selectedExercise.gameMode === 'timed' && (
          <div className="bg-purple-100 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-800 p-4 rounded-lg flex items-center gap-2">
            <Clock className="text-purple-600 dark:text-purple-400" size={20} />
            <span className="font-bold text-purple-700 dark:text-purple-400">
              ⏱️ Süre: {selectedExercise.timeLimit} dakika
            </span>
          </div>
        )}

        {!showResults ? (
          <>
            {/* Questions */}
            <div className="space-y-4">
              {selectedExercise.questions?.map((question, idx) => (
                <div key={question._id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex gap-3 mb-4">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-sm">
                      {idx + 1}
                    </span>
                    {question.difficulty && (
                      <span className={`px-3 py-1 text-sm font-bold border rounded-lg ${DifficultyBadge(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-lg">
                    {question.text}
                  </h3>

                  {/* Options */}
                  {question.options && question.options.length > 0 ? (
                    <div className="space-y-2">
                      {question.options.map((opt, idx) => (
                        <label
                          key={idx}
                          className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                        >
                          <input
                            type="radio"
                            name={question._id}
                            value={opt}
                            checked={exerciseAnswers[question._id] === opt}
                            onChange={(e) => setExerciseAnswers(prev => ({
                              ...prev,
                              [question._id]: e.target.value
                            }))}
                            className="w-4 h-4"
                          />
                          <span className="text-slate-700 dark:text-slate-300">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Cevabınızı yazın..."
                      value={exerciseAnswers[question._id] || ''}
                      onChange={(e) => setExerciseAnswers(prev => ({
                        ...prev,
                        [question._id]: e.target.value
                      }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitAnswers}
              disabled={submitting}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                submitting
                  ? 'bg-indigo-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Kontrol ediliyor...
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  {getText('submitAnswers')}
                </>
              )}
            </button>
          </>
        ) : results && (
          <>
            {/* Results */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-300 dark:border-emerald-800 p-6 rounded-xl">
                <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                  Tebrikler! 🎉
                </h2>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xl">
                  {results.score} / {selectedExercise.questions?.length * 10} Puan
                </p>
              </div>

              {/* Answer Review */}
              <div className="space-y-3">
                {selectedExercise.questions?.map((question, idx) => (
                  <div
                    key={question._id}
                    className={`p-4 rounded-lg border ${
                      results.answers?.[question._id]?.isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-800'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {results.answers?.[question._id]?.isCorrect ? (
                        <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-1" size={20} />
                      ) : (
                        <AlertCircle className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-1" size={20} />
                      )}
                      <p className="font-bold text-slate-800 dark:text-white">Soru {idx + 1}</p>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <strong>Sizin cevap:</strong> {results.answers?.[question._id]?.userAnswer}
                    </p>
                    {!results.answers?.[question._id]?.isCorrect && (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        <strong>Doğru cevap:</strong> {results.answers?.[question._id]?.correctAnswer}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedExercise(null)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                {getText('close')}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ---- Main List View ----
  return (
    <div className="flex-1 p-6 space-y-6 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-3">
          {getText('funExercises')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{getText('subtitle')}</p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
          <Lock className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 dark:text-slate-400">Henüz egzersiz açılmamış</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Öğretmeninizin egzersiz oluşturması için bekleyin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exercises.map(exercise => (
            <ExerciseCard
              key={exercise._id}
              exercise={exercise}
              onStart={handleStartExercise}
              isCompleted={exercise.submissions?.length > 0 && exercise.submissions[0].status === 'completed'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
