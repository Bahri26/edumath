import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/Button';

const TakeSurveyPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [answers, setAnswers] = useState({}); // { questionId: rating }
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Ölçek Seçenekleri
    const options = [
        { value: 5, label: "Kesinlikle Katılıyorum", emoji: "😍", color: "bg-green-100 border-green-300 text-green-700" },
        { value: 4, label: "Katılıyorum", emoji: "🙂", color: "bg-blue-100 border-blue-300 text-blue-700" },
        { value: 3, label: "Kararsızım", emoji: "😐", color: "bg-gray-100 border-gray-300 text-gray-700" },
        { value: 2, label: "Katılmıyorum", emoji: "😕", color: "bg-orange-100 border-orange-300 text-orange-700" },
        { value: 1, label: "Kesinlikle Katılmıyorum", emoji: "😡", color: "bg-red-100 border-red-300 text-red-700" },
    ];

    useEffect(() => {
        const fetchSurvey = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/surveys/${id}`);
                const data = res.data?.data || res.data;
                setSurvey(data || null);
            } catch (err) {
                setError(err);
                alert('Anket yüklenemedi.');
                navigate('/surveys');
            } finally {
                setLoading(false);
            }
        };
        fetchSurvey();
    }, [id, navigate]);

    const handleSelect = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        // Tüm sorular cevaplandı mı kontrolü
        if (Object.keys(answers).length < (survey?.questions || []).length) {
            alert("Lütfen tüm soruları cevaplayın.");
            return;
        }

        const formattedAnswers = Object.keys(answers).map(qId => ({
            question_id: parseInt(qId),
            rating: answers[qId]
        }));

        try {
            await api.post(`/surveys/${id}/submit`, {
                answers: formattedAnswers
            });
            alert("✅ Geri bildiriminiz için teşekkürler!");
            navigate('/surveys');
        } catch (error) {
            // Hatayı konsola yazdır
            console.error("Anket Gönderme Hatası:", error);
            
            // Kullanıcıya detaylı mesaj göster
            alert(error.response?.data?.message || "Bir hata oluştu. Lütfen F12 > Console sekmesine bakın.");
        }
    };

    if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;
    if (error) return <div className="p-10 text-center">Anket yüklenemedi.</div>;
    if (!survey) return <div className="p-10 text-center">Anket bulunamadı.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
            <div className="max-w-3xl mx-auto">
                
                {/* BAŞLIK KARTI */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">{survey.title}</h1>
                    <p className="text-gray-500">{survey.description}</p>
                </div>

                {/* SORULAR LİSTESİ */}
                <div className="space-y-6">
                    {(survey.questions || []).map((q, index) => (
                        <div key={q.question_id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex gap-3">
                                <span className="bg-indigo-100 text-indigo-600 w-8 h-8 flex items-center justify-center rounded-lg text-sm shrink-0">
                                    {index + 1}
                                </span> 
                                {q.question_text}
                            </h3>

                            {/* ŞIKLAR (RESPONSIVE GRID) */}
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                                {options.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleSelect(q.question_id, opt.value)}
                                        className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1
                                            ${answers[q.question_id] === opt.value 
                                                ? `${opt.color} shadow-md scale-105 ring-2 ring-offset-1 ring-indigo-200` 
                                                : 'border-gray-100 hover:bg-gray-50 text-gray-400 grayscale hover:grayscale-0'
                                            }`}
                                    >
                                        <span className="text-2xl">{opt.emoji}</span>
                                        <span className="text-[10px] font-bold text-center leading-tight">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* GÖNDER BUTONU */}
                <div className="mt-10 text-center pb-20">
                    <Button onClick={handleSubmit}>
                        📤 Anketi Tamamla
                    </Button>
                    <div className="mt-4">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/surveys')}
                            className="text-sm"
                        >
                            İptal
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TakeSurveyPage;
