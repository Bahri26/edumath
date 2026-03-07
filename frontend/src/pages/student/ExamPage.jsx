import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ExamPage = () => {
    const { id } = useParams(); // URL'den sınav ID'sini al
    const navigate = useNavigate();
    
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Hangi soruya hangi cevabın verildiğini tutan State
    const [selectedAnswers, setSelectedAnswers] = useState({});

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                // Seçilen sınavın sorularını getir
                const response = await api.get(`/exams/${id}/questions`); 
                setQuestions(response.data.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                alert("Sorular yüklenirken hata oluştu.");
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [id]);

    // Soruyu Raporla (Hata Bildir)
    const handleReportQuestion = async (questionId) => {
        const description = prompt("Bu soruda ne hata var? (Örn: Cevap yanlış, görsel yok, yazım hatası)");
        if (!description) return;

        try {
            await api.post('/questions/report', { questionId, description });
            alert("📢 Geri bildiriminiz gönderildi! Teşekkürler! 🙏");
        } catch (error) {
            alert('Hata: ' + (error.response?.data?.message || error.message));
        }
    };

    // Sınavı Bitir ve Veritabanına Kaydet
    const finishExam = async () => {
        // 1. Cevap formatını backend'in beklediği hale getiriyoruz
        const answersPayload = Object.keys(selectedAnswers).map(qId => ({
            question_id: parseInt(qId),
            option_id: selectedAnswers[qId].optionId
        }));

        // Hiç soru işaretlenmediyse uyarı ver
        if (answersPayload.length === 0) {
            alert("Lütfen en az bir soru işaretleyin!");
            return;
        }

        const confirmFinish = window.confirm("Sınavı bitirmek ve puanını görmek istiyor musun?");
        if (!confirmFinish) return;

        try {
            // 2. Giriş yapmış kullanıcıyı tarayıcı hafızasından al
               const storedUser = localStorage.getItem('edumath_user');
            
            // Eğer kullanıcı yoksa (giriş yapmamışsa) Login'e at
            if (!storedUser) {
                alert("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
                navigate('/login');
                return;
            }

            let user = {};
            try {
                   user = storedUser ? JSON.parse(storedUser) : {};
            } catch (e) {
                user = {};
            }

            // 3. Backend'e gönder (Dinamik student_id ile)
            const response = await api.post('/exams/submit', {
                student_id: user.user_id, // Giriş yapan kullanıcının ID'si
                exam_id: id,
                answers: answersPayload
            });

            const result = response.data.data;
            
            // 4. Sonucu Ekrana Bas
            alert(`🎉 Sınav Tamamlandı!\n\n🏆 Puanın: ${result.score}\n✅ Doğru Sayısı: ${result.correctCount}`);
            
            // Dashboard'a yönlendir
            navigate('/');

        } catch (err) {
            console.error(err);
            alert("Sınav gönderilirken hata oluştu! Konsolu kontrol et.");
        }
    };

    if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Sınav Yükleniyor...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
            
            {/* Üst Bilgi ve Geri Butonu */}
            <button onClick={() => navigate('/')} style={{marginBottom:'20px', cursor:'pointer', border:'none', background:'none', color:'#3498db', fontSize:'16px'}}>
                ← Sınav Listesine Dön
            </button>

            <h1 style={{ color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                Sınav #{id}
            </h1>
            
            {questions.length === 0 ? (
                <p>Bu sınavda henüz soru yok.</p>
            ) : (
                questions.map((q, index) => {
                    const userAnswer = selectedAnswers[q.question_id];
                    
                    return (
                        <div key={q.question_id} style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <h3 style={{ margin: 0, color: '#34495e' }}>Soru {index + 1}</h3>
                                <span style={badgeStyle}>{q.points} Puan</span>
                            </div>
                            
                            <p style={{ fontSize: '18px', marginBottom: '20px', lineHeight: '1.5' }}>
                                {q.content_text}
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                {q.options && q.options.map((opt) => {
                                    // Renk Mantığı:
                                    // Seçim yapıldıysa ve bu şık doğruysa -> YEŞİL
                                    // Seçim yapıldıysa, bu şık seçilmiş ama yanlışsa -> KIRMIZI
                                    let bgColor = 'white';
                                    let borderColor = '#ddd';
                                    
                                    if (userAnswer) {
                                        if (opt.is_correct === 1) {
                                            bgColor = '#d4edda'; 
                                            borderColor = '#c3e6cb';
                                        } else if (userAnswer.optionId === opt.option_id && userAnswer.isCorrect === 0) {
                                            bgColor = '#f8d7da'; 
                                            borderColor = '#f5c6cb';
                                        }
                                    }

                                    return (
                                        <button 
                                            key={opt.option_id} 
                                            onClick={() => handleOptionClick(q.question_id, opt.option_id, opt.is_correct)}
                                            style={{
                                                ...optionBtnStyle,
                                                backgroundColor: bgColor,
                                                borderColor: borderColor,
                                                cursor: userAnswer ? 'default' : 'pointer'
                                            }}
                                        >
                                            {opt.option_text}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Anlık Geri Bildirim Mesajı */}
                            {userAnswer && (
                                <div>
                                    <div style={{ marginTop: '15px', fontWeight: 'bold', color: userAnswer.isCorrect ? 'green' : 'red' }}>
                                        {userAnswer.isCorrect ? 'Doğru Cevap! 👏' : 'Yanlış Cevap. ⚠️'}
                                    </div>
                                    <button 
                                        onClick={() => handleReportQuestion(q.question_id)}
                                        style={{
                                            marginTop: '10px',
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            color: '#e74c3c',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        🚩 Bu soruda hata var
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })
            )}

            {/* Sınavı Bitir Butonu */}
            {questions.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '80px' }}>
                    <button 
                        onClick={finishExam}
                        style={finishBtnStyle}
                    >
                        ✅ Sınavı Bitir ve Gönder
                    </button>
                </div>
            )}
        </div>
    );
};

// --- STİLLER ---
const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    padding: '25px',
    marginBottom: '25px',
    border: '1px solid #e1e1e1'
};

const badgeStyle = {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '5px 10px',
    borderRadius: '15px',
    fontSize: '12px',
    fontWeight: 'bold'
};

const optionBtnStyle = {
    padding: '15px',
    textAlign: 'left',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    transition: 'all 0.2s',
    color: '#333',
    width: '100%'
};

const finishBtnStyle = {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '15px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(39, 174, 96, 0.3)',
    transition: 'transform 0.1s'
};

export default ExamPage;