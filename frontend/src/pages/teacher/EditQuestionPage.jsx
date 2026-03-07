import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const EditQuestionPage = () => {
    const { id } = useParams(); // URL'den ID'yi al
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [existingImageUrl, setExistingImageUrl] = useState('');

    const [question, setQuestion] = useState({
        content_text: '',
        difficulty: 'Kolay',
        options: []
    });

    // Sayfa açılınca mevcut veriyi çek
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await api.get(`/questions/${id}`);
                const data = res?.data?.data || res?.data;
                if (!data) throw new Error('question detail not found');
                
                // Backend'den gelen veriyi forma uyarla
                let diffText = 'Kolay';
                const diff = String(data.difficulty_level || '').toLocaleLowerCase('tr-TR');
                if (diff === '2' || diff === 'medium' || diff === 'orta') diffText = 'Orta';
                if (diff === '3' || diff === 'hard' || diff === 'zor') diffText = 'Zor';

                setQuestion({
                    content_text: data.content_text || '',
                    difficulty: diffText,
                    options: (data.options || []).map(o => ({ 
                        text: o.option_text, 
                        isCorrect: o.is_correct === 1 
                    }))
                });
                setExistingImageUrl(data.image_url || '');
                setLoading(false);
            } catch (error) {
                alert("Soru bilgileri alınamadı.");
                navigate('/question-bank');
            }
        };
        fetchDetail();
    }, [id, navigate]);

    const handleOptionChange = (index, value) => {
        const newOptions = [...question.options];
        newOptions[index].text = value;
        setQuestion({ ...question, options: newOptions });
    };

    const setCorrectOption = (index) => {
        const newOptions = question.options.map((opt, i) => ({
            ...opt,
            isCorrect: i === index
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

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('content_text', question.content_text);
            formData.append('difficulty', question.difficulty);
            formData.append('options', JSON.stringify(question.options));
            if (imageFile) {
                formData.append('image', imageFile);
            }

            await api.put(`/questions/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("✅ Soru güncellendi!");
            navigate('/question-bank');
        } catch (error) {
            alert("Güncelleme başarısız.");
        }
    };

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-10 font-sans flex justify-center">
            <div className="bg-white max-w-3xl w-full rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">✏️ Soruyu Düzenle</h1>
                    <button onClick={() => navigate('/question-bank')} className="text-gray-500 hover:text-gray-700">❌ İptal</button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Soru Metni</label>
                        <textarea 
                            value={question.content_text}
                            onChange={(e) => setQuestion({...question, content_text: e.target.value})}
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Soru Görseli (Opsiyonel)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                        />
                        {(imagePreview || existingImageUrl) && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                                <img src={imagePreview || existingImageUrl} alt="Önizleme" className="max-h-48 object-contain" />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Zorluk</label>
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
                        <label className="block text-sm font-bold text-gray-700 mb-3">Şıklar</label>
                        <div className="space-y-3">
                            {question.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div 
                                        onClick={() => setCorrectOption(i)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold cursor-pointer transition-colors border-2 ${opt.isCorrect ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-500 border-gray-300'}`}
                                    >
                                        {['A', 'B', 'C', 'D'][i]}
                                    </div>
                                    <input 
                                        type="text" 
                                        value={opt.text}
                                        onChange={(e) => handleOptionChange(i, e.target.value)}
                                        className={`flex-1 p-3 border rounded-lg outline-none ${opt.isCorrect ? 'border-green-500 ring-1 ring-green-500 bg-green-50' : 'border-gray-300'}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg">
                        💾 Değişiklikleri Kaydet
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditQuestionPage;
