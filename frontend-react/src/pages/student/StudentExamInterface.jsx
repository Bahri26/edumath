// frontend-react/src/pages/student/StudentExamInterface.jsx (SON KONTROL VE TAM HALİ)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
// ÖNEMLİ: CSS yolunun doğru olduğundan emin olun
import '../../assets/styles/TeacherPages.css'; 

const API_URL = 'http://localhost:8000/api';
const token = localStorage.getItem('token'); 
const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };


// --- SAHTE VERİ (Backend entegrasyonu için örnek) ---
const DUMMY_EXAM = {
    _id: 'e123',
    title: 'Örnek Matematik Sınavı',
    duration: 60, // 60 dakika
    questions: [
        { _id: 'q1', text: '3x + 5 = 14 ise x kaçtır?', options: ['3', '5', '7'], type: 'test' },
        { _id: 'q2', text: 'Dünya Güneş etrafında döner. (D/Y)', options: ['Doğru', 'Yanlış'], type: 'dogru-yanlis' },
        { _id: 'q3', text: '1/4 + 1/2 = ___', type: 'bosluk-doldurma' },
    ],
};
// --- SAHTE VERİ SONU ---


function StudentExamInterface() {
    const { examId } = useParams(); // URL'den sınav ID'sini al
    const navigate = useNavigate();
    
    // Yüklenme durumunda exam verisini kullanmak için
    const [exam, setExam] = useState(DUMMY_EXAM); 
    const [loading, setLoading] = useState(true); // Yüklenme state'i
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); 
    const [answers, setAnswers] = useState([]); 
    const [timeLeft, setTimeLeft] = useState(0); // Başlangıç 0
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [error, setError] = useState(null);
    
    // Sınavı Yükle
    useEffect(() => {
        // Gerçek API çağrısı burada yapılmalı:
        // axios.get(`${API_URL}/exams/${examId}`).then(res => { setExam(res.data); setTimeLeft(res.data.duration * 60); })
        
        // SAHTE VERİ YÜKLEME
        setAnswers(DUMMY_EXAM.questions.map(q => ({
            questionId: q._id,
            submittedAnswer: '',
        })));
        setTimeLeft(DUMMY_EXAM.duration * 60);
        setLoading(false);
    }, [examId]);


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
    }, [timeLeft, isSubmitted, loading]);


    // Cevapları Yönetme
    const handleAnswerChange = (value) => {
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
    const handleSubmit = async () => {
        if (isSubmitted) return; 
        setIsSubmitted(true);
        setError(null);

        const payload = {
            examId: exam._id,
            answers: answers,
            completionTime: exam.duration * 60 - timeLeft, // Harcanan süre
        };

        try {
            // Backend'e POST isteği: /api/results/submit (Puanlama burada gerçekleşir)
            const response = await axios.post(`${API_URL}/results/submit`, payload, axiosConfig);
            setSubmissionResult(response.data.summary);
            
            // Sonuç sayfasına yönlendirme veya sonuç özetini gösterme
        } catch (err) {
            setError(err.response?.data?.message || 'Sınav gönderimi sırasında kritik bir hata oluştu.');
            setIsSubmitted(false); // Başarısız olursa tekrar denemeye izin ver
        }
    };


    // Yardımcı Fonksiyonlar
    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const currentQuestion = exam.questions[currentQuestionIndex];
    const currentAnswer = answers.find(ans => ans.questionId === currentQuestion._id)?.submittedAnswer || '';
    const totalQuestions = exam.questions.length;

    if (loading) return <p className="teacher-page-container">Sınav verileri yükleniyor...</p>;
    
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