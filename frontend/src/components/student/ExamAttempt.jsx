import React, { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * ExamAttempt - Student taking an exam
 * Real-time exam solving with time tracking and answer submission
 */
function ExamAttempt({ examId, studentId, onComplete }) {
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExam();
  }, []);

  useEffect(() => {
    if (!timeRemaining || submitted) return;
    const timer = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) {
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, submitted]);

  const loadExam = async () => {
    try {
      const stored = localStorage.getItem('edumath_user');
      const user = stored ? JSON.parse(stored) : null;
      const studentId = user?.student_id || user?.id || user?.user_id;

      const examRes = await api.get(`/exams/${examId}`);
      setExam(examRes.data);
      
      const questionsRes = await api.get(`/exams/${examId}/questions`);
      setQuestions(questionsRes.data.data || questionsRes.data);
      
      setTimeRemaining(examRes.data.duration_minutes * 60);
      
      // Start attempt
      const attemptRes = await api.post(`/exams/${examId}/attempts`, { studentId });
      setAttemptId(attemptRes.data.attempt_id);
      
      setLoading(false);
    } catch (error) {
      console.error('Sınav yüklenemedi:', error);
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answerId) => {
    setAnswers({ ...answers, [questionId]: answerId });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Record all answers
      for (const [questionId, answerId] of Object.entries(answers)) {
        await api.post(`/exams/attempts/${attemptId}/answer`, {
          questionId: parseInt(questionId),
          selectedOptionId: answerId
        });
      }
      
      // Submit attempt
      await api.post(`/exams/attempts/${attemptId}/submit`);
      setSubmitted(true);
      onComplete?.(attemptId);
    } catch (error) {
      console.error('Sınav gönderilemedi:', error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours > 0 ? hours + 's:' : ''}${minutes}d ${secs}s`;
  };

  if (loading) return <div className="text-center py-8">Sınav yükleniyor...</div>;
  if (!exam || questions.length === 0) return <div className="text-center py-8">Sınav bulunamadı</div>;
  if (submitted) return <div className="text-center py-8 bg-green-50 rounded"><h2 className="text-xl font-bold">Sınav başarıyla gönderildi!</h2></div>;

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswered = answers[currentQuestion.id] !== undefined;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="exam-attempt max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-blue-50 p-4 rounded">
        <div>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <p className="text-gray-600">{answeredCount} / {questions.length} cevaplandı</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
            {formatTime(timeRemaining)}
          </div>
          <p className="text-sm text-gray-600">Kalan Süre</p>
        </div>
      </div>

      {/* Question Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Soru {currentQuestionIndex + 1} / {questions.length}</span>
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-white p-6 rounded shadow mb-6 border-l-4 border-blue-500">
        <h2 className="text-lg font-semibold mb-4">{currentQuestion.question_text}</h2>
        
        {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
          <div className="space-y-2">
            {currentQuestion.options.map((option) => (
              <label key={option.id} className="flex items-center p-3 border rounded hover:bg-blue-50 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={option.id}
                  checked={answers[currentQuestion.id] === option.id}
                  onChange={() => handleAnswerChange(currentQuestion.id, option.id)}
                  className="mr-3"
                />
                <span>{option.option_text}</span>
              </label>
            ))}
          </div>
        )}

        {currentQuestion.question_type === 'short_answer' && (
          <textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            placeholder="Cevap yazınız..."
            className="w-full border rounded px-3 py-2"
            rows="4"
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4 mb-6">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded disabled:opacity-50"
        >
          Önceki
        </button>
        
        <button
          onClick={handleNext}
          disabled={currentQuestionIndex === questions.length - 1}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Sonraki
        </button>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded font-semibold"
        >
          Sınavı Gönder ({answeredCount}/{questions.length} cevap)
        </button>
      </div>

      {/* Question Navigator Sidebar */}
      <div className="mt-6 bg-gray-50 p-4 rounded">
        <h3 className="font-semibold mb-3">Sorular</h3>
        <div className="grid grid-cols-10 gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`py-2 rounded text-sm font-medium transition-all ${
                idx === currentQuestionIndex ? 'bg-blue-600 text-white' :
                answers[q.id] !== undefined ? 'bg-green-400 text-white' :
                'bg-gray-300 text-gray-700'
              }`}
              title={`Soru ${idx + 1}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ExamAttempt;
