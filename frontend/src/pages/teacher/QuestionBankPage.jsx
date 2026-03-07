import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import MathText from '../../components/common/MathText';

const QuestionBankPage = () => {
    const navigate = useNavigate();
    // Role guard: only teachers should access question bank
    useEffect(() => {
        try {
            const stored = localStorage.getItem('edumath_user');
            const parsed = stored ? JSON.parse(stored) : null;
            const role = parsed?.role || (parsed?.role_id === 2 ? 'teacher' : parsed?.role_id === 3 ? 'student' : undefined);
            if (!role || role !== 'teacher') {
                navigate('/student-exams');
            }
        } catch (e) {
            navigate('/login');
        }
    }, [navigate]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef(null);
    
    // Filtreleme
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDifficulty, setFilterDifficulty] = useState("all");
    const [filterClass, setFilterClass] = useState("all");

    const normalizeDifficulty = (value) => {
        const normalized = String(value || '').toLocaleLowerCase('tr-TR').trim();
        if (['1', 'easy', 'kolay'].includes(normalized)) return 'easy';
        if (['2', 'medium', 'orta'].includes(normalized)) return 'medium';
        if (['3', 'hard', 'zor'].includes(normalized)) return 'hard';
        return 'medium';
    };

    const resolveClassTopic = (question) => {
        const rawTopic = String(question.topic || '').trim();
        const topicMatch = rawTopic.match(/^(\d+)\.\s*Sınıf\s*-\s*(.+)$/i);
        const topicClassLevel = topicMatch ? Number(topicMatch[1]) : null;
        const cleanedTopic = topicMatch ? topicMatch[2].trim() : rawTopic;

        const classLevel = Number(question.class_level || question.grade_level || topicClassLevel || 0);
        return {
            classLevel: Number.isInteger(classLevel) && classLevel > 0 ? classLevel : null,
            topic: cleanedTopic || null
        };
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await api.get('/questions/my-questions');
            setQuestions(res.data.data);
            setLoading(false);
        } catch (error) {
            console.error("Sorular yüklenemedi", error);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bu soruyu silmek istediğinize emin misiniz?")) {
            try {
                await api.delete(`/questions/${id}`);
                setQuestions(questions.filter(q => q.question_id !== id));
            } catch (error) {
                alert("Silme başarısız.");
            }
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert("Lütfen sadece PDF dosyası yükleyin.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/questions/upload-pdf', formData);
            alert(res.data.message);
            fetchQuestions();
        } catch (error) {
            console.error(error);
            alert("Yükleme sırasında hata oluştu. PDF çok büyük veya okunamaz olabilir.");
        } finally {
            setUploading(false);
            e.target.value = null;
        }
    };

    // --- ZORLUK SEVİYESİ TASARIMI (MODERN) ---
    const getDifficultyStyle = (level) => {
        const normalized = normalizeDifficulty(level);

        switch (normalized) {
            case 'easy': 
                return { label: 'Kolay', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🟢' };
            case 'medium': 
                return { label: 'Orta', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🟡' };
            case 'hard': 
                return { label: 'Zor', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: '🔴' };
            default: 
                return { label: 'Genel', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: '⚪' };
        }
    };

    // Filtreleme
    const filteredQuestions = questions.filter(q => {
        const matchesSearch = String(q.content_text || '').toLowerCase().includes(searchTerm.toLowerCase());
        const questionDifficulty = normalizeDifficulty(q.difficulty_level);
        const filterDifficultyKey = filterDifficulty === '1' ? 'easy' : filterDifficulty === '2' ? 'medium' : filterDifficulty === '3' ? 'hard' : 'all';
        const matchesDifficulty = filterDifficultyKey === "all" || questionDifficulty === filterDifficultyKey;

        const { classLevel } = resolveClassTopic(q);
        const questionClass = Number(classLevel || 0);
        const selectedClass = Number(filterClass || 0);
        const matchesClass = filterClass === "all" || questionClass === selectedClass;
        return matchesSearch && matchesDifficulty && matchesClass;
    });

    if (loading) return <div className="p-20 text-center text-xl text-gray-400 font-medium">✨ Sorular hazırlanıyor...</div>;

    return (

        <div className="min-h-screen bg-gray-50/50 p-6 md:p-12 font-sans">
            {/* --- BAŞLIK ALANI --- */}
            <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight flex items-center gap-3">
                        <span className="text-indigo-600">📚</span> Soru Bankası
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Toplam <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{filteredQuestions.length}</span> soru yönetiliyor.
                    </p>
                </div>
                {/* Sağ üst: Soru Ekle ve AI ile Hızlı Ekle butonları */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/create-question')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                    >
                        Soru Ekle
                    </button>
                    <button
                        onClick={() => navigate('/create-question?ai=1')}
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition"
                    >
                        AI ile Hızlı Ekle
                    </button>
                </div>
            </div>

            {/* --- FİLTRE PANELİ --- */}
            <div className="max-w-7xl mx-auto bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-10 flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Soru metni içinde ara..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-transparent border-none outline-none text-gray-700 font-medium placeholder-gray-400"
                    />
                </div>
                <div className="w-px bg-gray-100 my-2 hidden md:block"></div>
                <div className="w-full md:w-48 px-2">
                    <select 
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="w-full h-full px-4 py-4 bg-transparent border-none outline-none text-gray-700 font-bold cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <option value="all">Tüm Sınıflar</option>
                        <option value="1">1. Sınıf</option>
                        <option value="2">2. Sınıf</option>
                        <option value="3">3. Sınıf</option>
                        <option value="4">4. Sınıf</option>
                        <option value="5">5. Sınıf</option>
                        <option value="6">6. Sınıf</option>
                        <option value="7">7. Sınıf</option>
                        <option value="8">8. Sınıf</option>
                    </select>
                </div>
                <div className="w-px bg-gray-100 my-2 hidden md:block"></div>
                <div className="w-full md:w-48 px-2">
                    <select 
                        value={filterDifficulty}
                        onChange={(e) => setFilterDifficulty(e.target.value)}
                        className="w-full h-full px-4 py-4 bg-transparent border-none outline-none text-gray-700 font-bold cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <option value="all">Filtre: Tümü</option>
                        <option value="1">🟢 Kolay Seviye</option>
                        <option value="2">🟡 Orta Seviye</option>
                        <option value="3">🔴 Zor Seviye</option>
                    </select>
                </div>
            </div>

            {/* --- KART IZGARASI (GRID) --- */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredQuestions.map((q) => {
                    const style = getDifficultyStyle(q.difficulty_level);
                    const { classLevel, topic } = resolveClassTopic(q);
                    const languageLower = String(q.language || '').toLocaleLowerCase('tr-TR');
                    const topicLower = String(q.topic || q.subject || '').toLocaleLowerCase('tr-TR');
                    const computerIndicators = ['computer', 'bilgisayar', 'bilgisayar bilimi', 'program', 'programlama', 'coding', 'python', 'java', 'cs', 'algoritma'];
                    const isComputer = computerIndicators.some(ind => languageLower.includes(ind) || topicLower.includes(ind));
                    const showClass = !isComputer && classLevel;
                    
                    return (
                        <div key={q.question_id} className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 transition-all duration-300 group flex flex-col overflow-hidden hover:-translate-y-1">
                            
                            {/* --- KART BAŞLIĞI: Zorluk & ID --- */}
                            <div className="px-6 py-5 flex justify-between items-center border-b border-gray-50 bg-white">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-black tracking-wider uppercase flex items-center gap-2 border ${style.bg} ${style.text} ${style.border}`}>
                                    {style.icon} {style.label}
                                </span>
                                <span className="text-gray-300 font-mono text-sm group-hover:text-indigo-400 transition-colors">
                                    #{q.question_id}
                                </span>
                            </div>

                            {/* --- KART İÇERİĞİ --- */}
                            <div className="p-6 flex-1 relative">
                                {/* Görsel Varsa */}
                                {q.image_url && (
                                    <div className="mb-4 rounded-2xl overflow-hidden border border-gray-100 h-32 bg-gray-50 flex items-center justify-center relative">
                                        <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/5 transition-colors"></div>
                                        <img src={q.image_url} alt="Soru" className="h-full object-contain" />
                                    </div>
                                )}

                                {/* Soru Metni */}
                                <div className="text-gray-800 font-bold text-lg leading-relaxed line-clamp-4">
                                    <MathText text={q.content_text} />
                                </div>
                            </div>

                            {/* --- KART ALT BİLGİ: Sınıf/Konu & Butonlar --- */}
                            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                                {/* Sınıf / Konu Bilgisi */}
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sınıf / Konu</span>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {showClass ? `${classLevel}. Sınıf` : ''}{showClass && topic ? ' - ' : ''}{(!showClass && topic) ? topic : (showClass ? (topic || '') : (!topic ? 'Genel Tekrar' : ''))}
                                    </span>
                                </div>

                                {/* Düzenle / Sil */}
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => navigate(`/edit-question/${q.question_id}`)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-100 transition-all" 
                                        title="Düzenle"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                        </svg>
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(q.question_id)}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-100 transition-all" 
                                        title="Sil"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QuestionBankPage;