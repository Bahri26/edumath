// frontend-react/src/pages/student/StudentExamInterface.jsx (SON KONTROL VE TAM HALİ)

import React, { useState, useEffect, useCallback } from 'react';
import { startExam as startExamService } from '../../services/examService';
import { submitExamResult } from '../../services/resultService';
import { useParams, useNavigate } from 'react-router-dom';
import './StudentExamInterface.css';

// Base URL servis katmanında yönetiliyor.


// Dummy fallback kaldırıldı; başarısız durumda kullanıcıya mesaj gösterilecek.


function StudentExamInterface() {
    const { examId } = useParams(); // URL'den sınav ID'sini al
    const navigate = useNavigate();
    
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); 
    const [answers, setAnswers] = useState([]); 
    const [timeLeft, setTimeLeft] = useState(0); // Başlangıç 0
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [error, setError] = useState(null);
    
    // Sınavı yükle ve başlat
    useEffect(() => {
        let mounted = true;
        const fetchExam = async () => {
            setLoading(true);
            try {
                const data = await startExamService(examId);
                if (!mounted) return;
                
                if (!data || !data.questions || data.questions.length === 0) {
                    if (mounted) setError('Sınav bulunamadı veya sınav soruları yok.');
                    return;
                }
                
                // Backend'den gelen soru yapısını normalize et
                const normalizedExam = {
                    ...data,
                    questions: data.questions.map(q => ({
                        ...q,
                        _id: q._id || q.id,
                        type: q.type || q.questionType || 'test'
                    }))
                };
                
                setExam(normalizedExam);
                setAnswers(normalizedExam.questions.map(q => ({ questionId: q._id, submittedAnswer: '' })));
                setTimeLeft((data.duration || 60) * 60);
            } catch (e) {
                console.error('Sınav yüklenemedi:', e);
                if (mounted) setError(e.response?.data?.message || 'Sınav verisi alınamadı.');
            } finally {
                mounted && setLoading(false);
            }
        };
        fetchExam();
        return () => { mounted = false; };
    }, [examId]);


    // Cevapları Yönetme
    const handleAnswerChange = (value) => {
        if (!exam || !exam.questions || !exam.questions[currentQuestionIndex]) return;
        const questionId = exam.questions[currentQuestionIndex]._id;
        
        const updatedAnswers = answers.map(ans => {
            if (ans.questionId === questionId) {
                return { ...ans, submittedAnswer: value };
            }
            return ans;
        });

        setAnswers(updatedAnswers);
    };

    // Sınavı Gönderme (Backend Controller'ı Kullanma)
    const handleSubmit = useCallback(async () => {
        if (isSubmitted) return; 
        setIsSubmitted(true);
        setError(null);
        if (!exam) {
            setError('Sınav bulunamadı.');
            return;
        }
        const payload = {
            examId: exam._id,
            answers,
            completionTime: (exam.duration || 60) * 60 - timeLeft,
        };

        try {
            // Backend'e POST isteği: /api/results/submit (Puanlama burada gerçekleşir)
            const resp = await submitExamResult(payload);
            setSubmissionResult(resp.summary);
            
            // Sonuç sayfasına yönlendirme veya sonuç özetini gösterme
        } catch (err) {
            setError(err.response?.data?.message || 'Sınav gönderimi sırasında kritik bir hata oluştu.');
            setIsSubmitted(false); // Başarısız olursa tekrar denemeye izin ver
        }
    }, [isSubmitted, exam, answers, timeLeft]);

    // Zamanlayıcı Mantığı
    useEffect(() => {
        if (timeLeft <= 0 || isSubmitted || loading) return;

        const intervalId = setInterval(() => {
            setTimeLeft(t => t - 1);
        }, 1000);

        if (timeLeft <= 0) {
            clearInterval(intervalId);
            handleSubmit(); // Süre dolunca otomatik gönder
        }

        return () => clearInterval(intervalId);
    }, [timeLeft, isSubmitted, loading, handleSubmit]);


    // Yardımcı Fonksiyonlar
    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const currentQuestion = exam?.questions?.[currentQuestionIndex];
    const currentAnswer = currentQuestion ? (answers.find(ans => ans.questionId === currentQuestion._id)?.submittedAnswer || '') : '';
    const totalQuestions = exam?.questions?.length || 0;

    if (loading) return <p className="teacher-page-container">Sınav verileri yükleniyor...</p>;
    
    if (!exam || !exam.questions || exam.questions.length === 0) {
        return (
            <div className="teacher-page-container">
                <div className="alert alert-danger">Sınav bulunamadı veya sınav soruları yüklenemedi.</div>
            </div>
        );
    }
    
    if (isSubmitted && submissionResult) {
        return (
            <div className="teacher-page-container">
                <div className="page-card exam-finished">
                    <h2>Sınav Tamamlandı! 🎉</h2>
                    <p>Puanınız: <strong>{submissionResult.score}%</strong></p>
                    <p>Doğru: {submissionResult.correctCount} / Toplam: {submissionResult.totalQuestions}</p>
                    <button className="btn-primary" onClick={() => navigate('/student/dashboard')}>
                        Ana Sayfaya Dön
                    </button>
                </div>
            </div>
        );
    }
    
    if (!currentQuestion) return <p>Sınav soruları bulunamadı.</p>;


    // --- SINAV ARAYÜZÜ RENDER ---
    return (
        <div className="teacher-page-container">
            {error && <div className="alert alert-danger">{error}</div>}
            
            <div className="exam-header-bar">
                <h3>{exam.title}</h3>
                <div className="timer">
                    Kalan Süre: <span className={timeLeft < 60 ? 'timer-critical' : ''}>
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            <div className="page-card exam-main-card">
                
                {/* Sol Taraf: Soru Metni ve Cevap Alanı */}
                <div className="exam-question-area">
                    <p className="question-index">Soru {currentQuestionIndex + 1} / {totalQuestions}</p>
                    <p className="question-text">{currentQuestion.text}</p>
                    
                    <div className="answer-section">
                        <h4>Cevabınız:</h4>
                        {/* Cevap Alanını Dinamik Render Et */}
                        {currentQuestion.type === 'test' && (
                            <div className="options-list">
                                {currentQuestion.options.map((option, index) => (
                                    <label key={index} className="option-label">
                                        <input 
                                            type="radio" 
                                            name="answer" 
                                            value={option}
                                            checked={currentAnswer === option}
                                            onChange={() => handleAnswerChange(option)}
                                        />
                                        {String.fromCharCode(65 + index)}. {option}
                                    </label>
                                ))}
                            </div>
                        )}
                        {currentQuestion.type === 'dogru-yanlis' && (
                             <div className="options-list">
                                {['Doğru', 'Yanlış'].map((option, index) => (
                                    <label key={index} className="option-label">
                                        <input 
                                            type="radio" 
                                            name="answer" 
                                            value={option}
                                            checked={currentAnswer === option}
                                            onChange={() => handleAnswerChange(option)}
                                        />
                                        {option}
                                    </label>
                                ))}
                            </div>
                        )}
                        {currentQuestion.type === 'bosluk-doldurma' && (
                            <input
                                type="text"
                                className="form-control"
                                value={currentAnswer}
                                onChange={(e) => handleAnswerChange(e.target.value)}
                                placeholder="Boşluğa gelecek cevabı yazın"
                            />
                        )}
                    </div>
                </div>

                {/* Alt Kısım: Navigasyon Butonları */}
                <div className="exam-navigation">
                    <button 
                        className="btn-secondary" 
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(t => t - 1)}
                    >
                        Önceki Soru
                    </button>
                    
                    {currentQuestionIndex < totalQuestions - 1 ? (
                        <button 
                            className="btn-primary"
                            onClick={() => setCurrentQuestionIndex(t => t + 1)}
                        >
                            Sonraki Soru
                        </button>
                    ) : (
                        <button 
                            className="btn-danger"
                            onClick={handleSubmit}
                            disabled={isSubmitted}
                        >
                            Sınavı Bitir ve Gönder
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StudentExamInterface;