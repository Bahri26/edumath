import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Button from '../../components/ui/Button';

const CreateExamPage = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('manual');
    
    // Form Verileri
    const [examData, setExamData] = useState({ 
        title: '', 
        duration: 20,
        grade_level: 5,
        topic: '',
        exam_type: 'diagnostic'
    });
    const [autoLoading, setAutoLoading] = useState(false);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [questionsError, setQuestionsError] = useState(null);
    
    // Listeler
    const [questionPool, setQuestionPool] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]); // Sınava eklenenler

    const normalizeDifficulty = (value) => {
        const normalized = String(value || '').toLocaleLowerCase('tr-TR').trim();
        if (['1', 'easy', 'kolay'].includes(normalized)) return 'easy';
        if (['2', 'medium', 'orta'].includes(normalized)) return 'medium';
        if (['3', 'hard', 'zor'].includes(normalized)) return 'hard';
        return 'medium';
    };

    const resolveQuestionLevel = (question) => {
        // Prefer class_level because legacy records may carry stale grade_level values.
        const value = question?.class_level ?? question?.grade_level ?? null;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    };

    const filterQuestionsBySelectedClass = (rows, gradeLevel) => {
        return rows.filter((q) => resolveQuestionLevel(q) === Number(gradeLevel));
    };

    useEffect(() => {
        // Role guard: only teachers should access this page
        try {
            const stored = localStorage.getItem('edumath_user');
            const parsed = stored ? JSON.parse(stored) : null;
            const role = parsed?.role || (parsed?.role_id === 2 ? 'teacher' : parsed?.role_id === 3 ? 'student' : undefined);
            if (!role || role !== 'teacher') {
                navigate('/student-exams');
                return;
            }
        } catch (e) {
            navigate('/login');
            return;
        }

        const fetchQuestionsByGrade = async () => {
            if (mode !== 'manual') return;
            setQuestionsLoading(true);
            setQuestionsError(null);
            try {
                const res = await api.get('/questions?limit=1000&require_options=4');
                const rows = res.data.data || [];
                setQuestionPool(filterQuestionsBySelectedClass(rows, examData.grade_level));
            } catch (error) {
                setQuestionsError('Sorular yüklenemedi.');
            } finally {
                setQuestionsLoading(false);
            }
        };

        fetchQuestionsByGrade();
    }, [examData.grade_level, mode]);

    const difficultyCounts = useMemo(() => {
        const counts = { Easy: 0, Medium: 0, Hard: 0 };
        selectedQuestions.forEach((q) => {
            const diff = normalizeDifficulty(q.difficulty_level);
            if (diff === 'easy') counts.Easy += 1;
            else if (diff === 'medium') counts.Medium += 1;
            else if (diff === 'hard') counts.Hard += 1;
        });
        return counts;
    }, [selectedQuestions]);

    // Soru Ekle / Çıkar
    const toggleQuestion = (question) => {
        const isSelected = selectedQuestions.find(q => q.question_id === question.question_id);
        
        if (isSelected) {
            setSelectedQuestions(selectedQuestions.filter(q => q.question_id !== question.question_id));
        } else {
            setSelectedQuestions([...selectedQuestions, question]);
        }
    };

    // Kaydet
    const handleSave = async () => {
        if (!examData.title) return alert("Lütfen sınav adı girin.");
        if (selectedQuestions.length === 0) return alert("Lütfen en az bir soru seçin.");

        try {
            const storedUser = localStorage.getItem('edumath_user');
            const parsedUser = storedUser ? JSON.parse(storedUser) : null;
            const createdBy = parsedUser?.user_id || parsedUser?.id || parsedUser?.student_id || null;

            const createRes = await api.post('/exams', {
                title: examData.title,
                duration_minutes: examData.duration,
                created_by: createdBy,
                exam_type: examData.exam_type,
                status: 'draft',
                is_published: false
            });

            const createdExam = createRes.data?.data || createRes.data || {};
            const examId = createdExam.exam_id || createdExam.id;
            if (!examId) throw new Error('Sınav ID alınamadı');

            for (const q of selectedQuestions) {
                const questionId = q.question_id || q.id;
                if (!questionId) continue;
                await api.post(`/exams/${examId}/questions/${questionId}`, { questionId });
            }

            await api.post(`/exams/${examId}/publish`);
            alert("✅ Sınav başarıyla oluşturuldu ve yayınlandı!");
            navigate('/teacher-dashboard');
        } catch (error) {
            alert("Hata oluştu: " + (error.response?.data?.message || error.response?.data?.error || error.message));
        }
    };

    const handleAutoCreate = async () => {
        if (!examData.title) return alert("Lütfen sınav adı girin.");

        setAutoLoading(true);
        try {
            const res = await api.post('/exams/auto-create', examData);
            alert(`✅ ${res.data.message}\nToplam ${res.data.data.questionCount} soru eklendi.`);
            navigate('/teacher-dashboard');
        } catch (error) {
            alert("Hata: " + (error.response?.data?.message || "Oluşturulamadı."));
        } finally {
            setAutoLoading(false);
        }
    };

    useEffect(() => {
        if (examData.exam_type !== 'diagnostic') return;
        if (Number(examData.duration) === 20) return;
        setExamData((prev) => ({ ...prev, duration: 20 }));
    }, [examData.exam_type, examData.duration]);


    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            
            {/* ÜST BAŞLIK, MOD SEÇİMİ VE AYARLAR */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">✨ Yeni Sınav Oluştur</h1>
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
                        <button 
                            onClick={() => setMode('manual')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'manual' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            ✋ Manuel Seçim
                        </button>
                        <button 
                            onClick={() => setMode('auto')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'auto' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            🤖 Otomatik
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Sınav Adı</label>
                        <input 
                            type="text" 
                            value={examData.title}
                            onChange={(e) => setExamData({...examData, title: e.target.value})}
                            placeholder="Örn: 1. Dönem Matematik Vizesi"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Süre (Dk)</label>
                        <input 
                            type="number" 
                            value={examData.duration}
                            onChange={(e) => setExamData({...examData, duration: Number(e.target.value)})}
                            className="w-full p-3 border rounded-lg outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Sınıf Seviyesi</label>
                        <select
                            value={examData.grade_level}
                            onChange={(e) => setExamData({ ...examData, grade_level: Number(e.target.value) })}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}. Sınıf</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Sınav Türü</label>
                        <select
                            value={examData.exam_type}
                            onChange={(e) => setExamData({ ...examData, exam_type: e.target.value })}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                        >
                            <option value="summative">Genel Sınav</option>
                            <option value="diagnostic">Ölçme &amp; Değerlendirme</option>
                        </select>
                    </div>
                </div>

                {mode === 'manual' && (
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm text-gray-500">Seçilen Soru</p>
                            <p className="text-2xl font-bold text-indigo-600">{selectedQuestions.length}</p>
                        </div>
                        <Button onClick={handleSave}>
                            💾 Sınavı Yayınla
                        </Button>
                    </div>
                )}
            </div>

            {mode === 'auto' ? (
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-10 text-white text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold mb-4">🚀 Hızlı Sınav Oluşturucu</h2>
                        <p className="text-indigo-100 mb-8 text-lg">
                            Seçtiğiniz kriterlere göre havuzdan <b>7 Kolay, 7 Orta ve 7 Zor</b> olmak üzere toplam 21 soru otomatik olarak seçilip sınav oluşturulacaktır.
                        </p>

                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 mb-8 text-left">
                            <label className="block text-sm font-bold text-indigo-200 mb-2">Hangi Konudan Soru Çekilsin? (Opsiyonel)</label>
                            <input 
                                type="text" 
                                className="w-full p-4 bg-white/90 text-gray-800 rounded-xl focus:ring-4 focus:ring-indigo-400 outline-none placeholder-gray-400"
                                placeholder="Örn: Örüntüler, Kesirler (Tüm konular için boş bırakın)"
                                value={examData.topic}
                                onChange={(e) => setExamData({...examData, topic: e.target.value})}
                            />
                        </div>

                        <button 
                            onClick={handleAutoCreate}
                            disabled={autoLoading}
                            className="w-full py-4 bg-white text-indigo-700 font-bold text-xl rounded-2xl hover:bg-indigo-50 hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-3"
                        >
                            {autoLoading ? 'Sınav Hazırlanıyor...' : '🎲 Soruları Karıştır ve Yayınla'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                    
                    {/* SOL: SORU HAVUZU */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                📦 Soru Havuzu
                                <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg">
                                    {examData.grade_level}. Sınıf
                                </span>
                            </h3>
                            <span className="text-sm text-gray-500">{questionPool.length} Soru</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {questionsLoading && (
                                <p className="text-center text-gray-400 mt-10">Sorular yükleniyor...</p>
                            )}
                            {questionsError && (
                                <p className="text-center text-red-500 mt-10">{questionsError}</p>
                            )}
                            {!questionsLoading && !questionsError && questionPool.length === 0 && (
                                <p className="text-center text-gray-400 mt-10">Bu sınıfa ait soru bulunamadı.</p>
                            )}
                            {!questionsLoading && !questionsError && questionPool.map((q) => {
                                const isSelected = selectedQuestions.some(sq => sq.question_id === q.question_id);
                                const diff = normalizeDifficulty(q.difficulty_level);
                                return (
                                    <div key={q.question_id} className={`p-4 rounded-xl border transition-all flex justify-between items-center ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-300'}`}>
                                        <div>
                                            <div className="flex gap-2 mb-2">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                                    diff === 'easy' ? 'bg-green-100 text-green-700' :
                                                    diff === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {diff === 'easy' ? 'Kolay' : diff === 'medium' ? 'Orta' : 'Zor'}
                                                </span>
                                                {q.topic && (
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{q.topic}</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700 line-clamp-1">{q.content_text}</p>
                                        </div>
                                        <button 
                                            onClick={() => toggleQuestion(q)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold ${isSelected ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}
                                        >
                                            {isSelected ? 'Çıkar' : 'Ekle'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* SAĞ: SEÇİLEN SORULAR VE SAYAÇ */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-indigo-50">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-indigo-900">📝 Seçilen Sorular</h3>
                                <span className="font-black text-2xl text-indigo-600">{selectedQuestions.length}</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white p-2 rounded-lg text-center border border-green-200">
                                    <div className="text-xs text-gray-500 font-bold uppercase">Kolay</div>
                                    <div className="text-lg font-black text-green-600">{difficultyCounts.Easy}</div>
                                </div>
                                <div className="bg-white p-2 rounded-lg text-center border border-yellow-200">
                                    <div className="text-xs text-gray-500 font-bold uppercase">Orta</div>
                                    <div className="text-lg font-black text-yellow-600">{difficultyCounts.Medium}</div>
                                </div>
                                <div className="bg-white p-2 rounded-lg text-center border border-red-200">
                                    <div className="text-xs text-gray-500 font-bold uppercase">Zor</div>
                                    <div className="text-lg font-black text-red-600">{difficultyCounts.Hard}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {selectedQuestions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                                    <div className="text-4xl mb-2">👈</div>
                                    <p>Soldan soru ekleyin</p>
                                </div>
                            ) : (
                                selectedQuestions.map((q, index) => (
                                    <div key={q.question_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <span className="font-bold text-gray-400 w-6">{index + 1}.</span>
                                        <div className="flex-1 text-sm text-gray-700 truncate">{q.content_text}</div>
                                        <button onClick={() => toggleQuestion(q)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100">
                            <button 
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200"
                                onClick={handleSave}
                                disabled={selectedQuestions.length === 0}
                            >
                                Sınavı Tamamla ({selectedQuestions.length} Soru)
                            </button>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default CreateExamPage;
