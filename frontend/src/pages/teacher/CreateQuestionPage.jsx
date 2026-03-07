import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import MathText from '../../components/common/MathText';
import AIQuestionUploader from '../../components/teacher/AIQuestionUploader';

const PLACEHOLDER_EMOJI_MAP = {
    '[SARI_KARE]': '🟨',
    '[MAVI_KARE]': '🟦',
    '[KIRMIZI_KARE]': '🟥',
    '[YESIL_KARE]': '🟩',
    '[SARI_DAIRE]': '🟡',
    '[MAVI_DAIRE]': '🔵',
    '[KIRMIZI_DAIRE]': '🔴',
    '[YESIL_DAIRE]': '🟢',
    '[SARI_UCGEN]': '🔺',
    '[MAVI_UCGEN]': '🔷',
    '[KIRMIZI_UCGEN]': '🔻',
    '[YESIL_UCGEN]': '🔶'
};

const SYMBOL_OPTIONS = [
    { label: '🟨 Sarı Kare', value: '🟨' },
    { label: '🟦 Mavi Kare', value: '🟦' },
    { label: '🟥 Kırmızı Kare', value: '🟥' },
    { label: '🟩 Yeşil Kare', value: '🟩' },
    { label: '🟡 Sarı Daire', value: '🟡' },
    { label: '🔵 Mavi Daire', value: '🔵' },
    { label: '🔴 Kırmızı Daire', value: '🔴' },
    { label: '🟢 Yeşil Daire', value: '🟢' },
    { label: '🔺 Üçgen', value: '🔺' },
    { label: '🔷 Elmas', value: '🔷' },
    { label: '🔻 Ters Üçgen', value: '🔻' },
    { label: '🔶 Elmas (Turuncu)', value: '🔶' }
];

const PLACEHOLDER_REGEX = /\[[A-ZÇĞİÖŞÜ_]+\]/g;

function detectPlaceholders(text) {
    return [...new Set(String(text || '').match(PLACEHOLDER_REGEX) || [])];
}

function replacePlaceholder(text, placeholder, replacement) {
    return String(text || '').split(placeholder).join(replacement);
}

function convertKnownPlaceholdersToEmoji(text) {
    let result = String(text || '');
    Object.entries(PLACEHOLDER_EMOJI_MAP).forEach(([placeholder, emoji]) => {
        result = replacePlaceholder(result, placeholder, emoji);
    });
    return result;
}

const CreateQuestionPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [detectedPlaceholders, setDetectedPlaceholders] = useState([]);

    const [question, setQuestion] = useState({
        content_text: '',
        difficulty: 'Kolay',
        class_level: '1',
        subject: 'Matematik', // Varsayılan
        options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
        ]
    });

    const handleOptionChange = (index, value) => {
        const newOptions = [...question.options];
        newOptions[index].text = value;
        setQuestion({ ...question, options: newOptions });
    };

    const setCorrectOption = (index) => {
        const newOptions = question.options.map((opt, i) => ({
            ...opt,
            isCorrect: i === index // Sadece tıklananı true yap
        }));
        setQuestion({ ...question, options: newOptions });
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            setImageFile(null);
            setImagePreview('');
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    useEffect(() => {
        setDetectedPlaceholders(detectPlaceholders(question.content_text));
    }, [question.content_text]);

    const handleAutoConvertPlaceholders = () => {
        const converted = convertKnownPlaceholdersToEmoji(question.content_text);
        setQuestion((prev) => ({ ...prev, content_text: converted }));
    };

    const handleManualPlaceholderReplace = (placeholder, symbol) => {
        const converted = replacePlaceholder(question.content_text, placeholder, symbol);
        setQuestion((prev) => ({ ...prev, content_text: converted }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basit Validasyon
        if (!question.content_text) return alert("Soru metni boş olamaz!");
        if (question.options.some(o => !o.text)) return alert("Tüm şıkları doldurmalısınız!");
        if (!question.options.some(o => o.isCorrect)) return alert("Lütfen doğru cevabı işaretleyin!");

        setLoading(true);
        try {
            let uploadedImageUrl = '';
            if (imageFile) {
                setUploadingImage(true);
                const imageForm = new FormData();
                imageForm.append('image', imageFile);
                const uploadRes = await api.post('/uploads/image', imageForm, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedImageUrl = uploadRes?.data?.url || '';
                setUploadingImage(false);
            }

            const difficultyMap = {
                Kolay: 'easy',
                Orta: 'medium',
                Zor: 'hard'
            };

            const payload = {
                content_text: question.content_text,
                subject: question.subject,
                class_level: Number(question.class_level) || null,
                difficulty_level: difficultyMap[question.difficulty] || 'medium',
                type: 'multiple_choice',
                options: question.options.map((opt) => ({
                    optionText: opt.text,
                    isCorrect: !!opt.isCorrect
                }))
            };

            if (uploadedImageUrl) {
                payload.image_url = uploadedImageUrl;
            }

            await api.post('/questions', payload, {
                headers: { 'Content-Type': 'application/json' }
            });
            alert("✅ Soru başarıyla havuza eklendi!");
            navigate('/question-bank');
        } catch (error) {
            console.error(error);
            alert("Soru kaydedilemedi: " + (error.response?.data?.error || error.response?.data?.message || "Hata"));
        } finally {
            setUploadingImage(false);
            setLoading(false);
        }
    };

    const handleGenerateAI = async () => {
        const topic = prompt("Hangi konuda sorular oluşturulsun? (Örn: Cebir, Geometri, Trigonometri)");
        if (!topic) return;

        const countStr = prompt("Kaç adet soru oluşturulsun? (1-10)");
        const count = Math.min(Math.max(parseInt(countStr) || 5, 1), 10);

        setGeneratingAI(true);
        try {
            const res = await api.post('/questions/generate-ai', { topic, count, difficulty: "mixed" });
            const createdCount = res?.data?.count ?? res?.data?.data?.count ?? count;
            alert(`✅ ${createdCount} adet soru AI tarafından oluşturuldu ve soru bankasına eklendi!`);
            navigate('/question-bank');
        } catch (error) {
            console.error(error);
            alert("Sorular oluşturulamadı: " + (error.response?.data?.message || "Hata"));
        } finally {
            setGeneratingAI(false);
        }
    };

    // Eğer URL parametresinde ai=1 varsa otomatik AI üretimini başlat
    const location = useLocation();
    useEffect(() => {
        try {
            const params = new URLSearchParams(location.search);
            if (params.get('ai') === '1') {
                // küçük bir gecikme ile promptu tetikle
                setTimeout(() => handleGenerateAI(), 200);
            }
        } catch (e) {}
    }, [location.search]);

    return (
        <div className="min-h-screen bg-gray-50 p-10 font-sans flex justify-center">
            <div className="bg-white max-w-3xl w-full rounded-2xl shadow-xl p-8 border border-gray-100">
                
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        ✏️ Yeni Soru Oluştur
                    </h1>
                    <div className="flex gap-3">
                        <button 
                            type="button"
                            onClick={handleGenerateAI}
                            disabled={generatingAI}
                            className={`px-6 py-2 font-bold rounded-lg flex items-center gap-2 transition-all ${
                                generatingAI 
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                        >
                            {generatingAI ? '⏳ Üretiliyor...' : '🤖 AI ile Oluştur'}
                        </button>
                        <button onClick={() => navigate('/teacher-dashboard')} className="text-gray-500 hover:text-gray-700">❌ İptal</button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* AI ile Fotoğraftan Soru Analizi */}
                    <AIQuestionUploader 
                        onQuestionCreated={(data) => {
                            setQuestion({
                                content_text: convertKnownPlaceholdersToEmoji(data.content_text || ''),
                                difficulty: data.difficulty_level === 1 ? 'Kolay' : data.difficulty_level === 2 ? 'Orta' : 'Zor',
                                class_level: String(data.class_level || 1),
                                subject: data.topic || question.subject,
                                options: (data.options || []).map(opt => ({
                                    text: opt.option_text,
                                    isCorrect: opt.is_correct === 1
                                }))
                            });
                        }}
                    />
                    
                    {/* Soru Metni */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Soru Metni</label>
                        <textarea 
                            value={question.content_text}
                            onChange={(e) => setQuestion({...question, content_text: e.target.value})}
                            placeholder="Sorunuzu buraya yazın... (Örn: $x^2 + y^2 = 25$)"
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-32 resize-none"
                        ></textarea>

                        {detectedPlaceholders.length > 0 && (
                            <div className="mt-3 p-3 border border-amber-200 bg-amber-50 rounded-xl space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-bold text-amber-800">
                                        Semboller metin etiketi olarak algılandı. İstersen emojiye dönüştürebilirsin.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleAutoConvertPlaceholders}
                                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                                    >
                                        Tümünü Emojiye Dönüştür
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {detectedPlaceholders.map((placeholder) => (
                                        <div key={placeholder} className="flex items-center gap-2 bg-white border border-amber-100 rounded-lg p-2">
                                            <span className="text-xs font-mono font-bold text-gray-700 min-w-[110px]">{placeholder}</span>
                                            <select
                                                className="flex-1 p-2 text-xs border border-gray-300 rounded-md"
                                                defaultValue={PLACEHOLDER_EMOJI_MAP[placeholder] || ''}
                                                onChange={(e) => {
                                                    if (!e.target.value) return;
                                                    handleManualPlaceholderReplace(placeholder, e.target.value);
                                                }}
                                            >
                                                <option value="">Sembol seç...</option>
                                                {SYMBOL_OPTIONS.map((opt) => (
                                                    <option key={`${placeholder}-${opt.value}`} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* CANLI ÖNİZLEME */}
                        {question.content_text && (
                            <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                <span className="text-xs text-gray-400 font-bold block mb-2">ÖNİZLEME:</span>
                                <MathText text={question.content_text} />
                            </div>
                        )}
                    </div>

                    {/* Görsel Yükleme */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Soru Görseli (Opsiyonel)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        />
                        {imagePreview && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                                <img src={imagePreview} alt="Önizleme" className="max-h-48 object-contain" />
                            </div>
                        )}
                    </div>

                    {/* Ayarlar (Yan Yana) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Sınıf Düzeyi</label>
                            <select
                                value={question.class_level}
                                onChange={(e) => setQuestion({...question, class_level: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                                    <option key={grade} value={String(grade)}>
                                        {grade}. Sınıf
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Zorluk Seviyesi</label>
                            <select 
                                value={question.difficulty}
                                onChange={(e) => setQuestion({...question, difficulty: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            >
                                <option value="Kolay">🟢 Kolay</option>
                                <option value="Orta">🟡 Orta</option>
                                <option value="Zor">🔴 Zor</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Ders / Konu</label>
                            <input 
                                type="text" 
                                value={question.subject}
                                onChange={(e) => setQuestion({...question, subject: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                                placeholder="Örn: Cebir"
                            />
                        </div>
                    </div>

                    {/* Şıklar */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Şıklar (Doğru cevabın yanındaki kutucuğu işaretleyin)</label>
                        <div className="space-y-3">
                            {question.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div 
                                        onClick={() => setCorrectOption(i)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold cursor-pointer transition-colors border-2 ${opt.isCorrect ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'}`}
                                    >
                                        {['A', 'B', 'C', 'D'][i]}
                                    </div>
                                    <input 
                                        type="text" 
                                        value={opt.text}
                                        onChange={(e) => handleOptionChange(i, e.target.value)}
                                        placeholder={`${['A', 'B', 'C', 'D'][i]} şıkkı metni`}
                                        className={`flex-1 p-3 border rounded-lg outline-none ${opt.isCorrect ? 'border-green-500 ring-1 ring-green-500 bg-green-50' : 'border-gray-300 focus:border-indigo-500'}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Kaydet Butonu */}
                    <button 
                        type="submit" 
                        disabled={loading || uploadingImage}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transform hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploadingImage ? 'Görsel Yükleniyor...' : loading ? 'Kaydediliyor...' : '💾 Soruyu Havuza Kaydet'}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default CreateQuestionPage;
