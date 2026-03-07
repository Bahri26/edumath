import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CreateSurveyPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [wordFile, setWordFile] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        questions: ['']
    });

    const templates = [
        {
            id: 1,
            icon: '🎓',
            name: 'Ders Değerlendirme',
            desc: 'Dersin işlenişi ve materyaller hakkında geri bildirim.',
            data: {
                title: 'Matematik Dersi Değerlendirmesi',
                description: 'Lütfen bu dönemki ders işleyişimizi değerlendirin.',
                questions: [
                    'Ders anlatımı anlaşılır mıydı?',
                    'Ders materyalleri (slayt, test) yeterli miydi?',
                    'Öğretmen sorulara yeterince vakit ayırdı mı?',
                    'Ders saatlerine zamanında uyuldu mu?'
                ]
            }
        },
        {
            id: 2,
            icon: '😊',
            name: 'Platform Memnuniyeti',
            desc: 'EduMath kullanımı hakkında genel görüşler.',
            data: {
                title: 'EduMath Kullanıcı Deneyimi',
                description: 'Platformumuzu geliştirmemiz için bize puan verin.',
                questions: [
                    'Sitenin kullanımı kolay mı?',
                    'Sayfalar hızlı yükleniyor mu?',
                    'Tasarımı beğendiniz mi?',
                    'Telefondan kullanım rahat mı?'
                ]
            }
        },
        {
            id: 3,
            icon: '📝',
            name: 'Sınav Zorluk Anketi',
            desc: 'Son yapılan sınavın zorluk derecesini ölçün.',
            data: {
                title: 'Sınav Zorluk Değerlendirmesi',
                description: 'Son sınav hakkındaki düşünceleriniz bizim için önemli.',
                questions: [
                    'Sınav süresi yeterli miydi?',
                    'Sorular işlenen konularla uyumlu muydu?',
                    'Sınavın zorluk derecesi nasıldı?'
                ]
            }
        }
    ];

    const applyTemplate = (templateData) => {
        setFormData({
            title: templateData.title,
            description: templateData.description,
            questions: [...templateData.questions]
        });
    };

    const handleQuestionChange = (index, value) => {
        const newQuestions = [...formData.questions];
        newQuestions[index] = value;
        setFormData({ ...formData, questions: newQuestions });
    };

    const addQuestion = () => {
        setFormData({ ...formData, questions: [...formData.questions, ''] });
    };

    const removeQuestion = (index) => {
        const newQuestions = formData.questions.filter((_, i) => i !== index);
        setFormData({ ...formData, questions: newQuestions });
    };

    const handleSubmit = async () => {
        if (!formData.title || formData.questions.some(q => q.trim() === '')) {
            alert('Lütfen başlık ve tüm soru alanlarını doldurun.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/surveys', formData);
            alert('✅ Anket başarıyla oluşturuldu!');
            navigate('/surveys');
        } catch (error) {
            console.error(error);
            alert('Hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoCreateFromWord = async () => {
        if (!wordFile) {
            alert('Lütfen bir Word (.docx) veya .txt dosyası seçin.');
            return;
        }

        setImportLoading(true);
        try {
            const payload = new FormData();
            payload.append('file', wordFile);

            await api.post('/surveys/import-word', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('✅ Dosya AI ile okundu ve anket otomatik oluşturuldu!');
            navigate('/surveys');
        } catch (error) {
            alert('❌ Word dosyasından anket oluşturulamadı: ' + (error.response?.data?.message || 'Hata'));
        } finally {
            setImportLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-10 font-sans">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">✨ Yeni Anket Oluştur</h1>
                    <button onClick={() => navigate('/surveys')} className="text-gray-500 hover:text-gray-900">
                        İptal
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                            <h2 className="text-lg font-bold text-gray-700 mb-4">Anket Detayları</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1">Anket Başlığı</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Örn: Haftalık Değerlendirme"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1">Açıklama</label>
                                    <textarea
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                        placeholder="Bu anketin amacı..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-700">Sorular</h2>
                                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded">1-5 Puanlık Sistem</span>
                            </div>

                            <div className="space-y-3">
                                {formData.questions.map((q, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full font-bold text-gray-500 shrink-0">
                                            {index + 1}
                                        </div>
                                        <input
                                            type="text"
                                            className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Sorunuzu yazın..."
                                            value={q}
                                            onChange={(e) => handleQuestionChange(index, e.target.value)}
                                        />
                                        {formData.questions.length > 1 && (
                                            <button
                                                onClick={() => removeQuestion(index)}
                                                className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={addQuestion}
                                className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 font-bold rounded-xl hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            >
                                + Yeni Soru Ekle
                            </button>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-transform transform hover:-translate-y-1"
                        >
                            {loading ? 'Oluşturuluyor...' : 'Anketi Yayınla 🚀'}
                        </button>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mt-6">
                            <h2 className="text-lg font-bold text-gray-700 mb-3">Word'den Otomatik Anket</h2>
                            <p className="text-sm text-gray-500 mb-4">
                                .docx veya .txt dosyası yükleyin, AI içeriği okuyup anketi otomatik oluştursun.
                            </p>
                            <input
                                type="file"
                                accept=".docx,.txt"
                                onChange={(e) => setWordFile(e.target.files?.[0] || null)}
                                className="w-full p-3 border rounded-xl bg-gray-50"
                            />
                            <button
                                onClick={handleAutoCreateFromWord}
                                disabled={importLoading}
                                className="mt-4 w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition"
                            >
                                {importLoading ? 'AI işliyor...' : 'Word Dosyasından Otomatik Oluştur'}
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl sticky top-8">
                            <h2 className="text-xl font-bold mb-2">Hızlı Şablonlar</h2>
                            <p className="text-indigo-200 text-sm mb-6">Zaman kazanmak için hazır şablonlardan birini seç.</p>

                            <div className="space-y-4">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        onClick={() => applyTemplate(template.data)}
                                        className="bg-white/10 hover:bg-white/20 border border-white/10 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">{template.icon}</span>
                                            <h3 className="font-bold">{template.name}</h3>
                                        </div>
                                        <p className="text-xs text-indigo-200 leading-relaxed">
                                            {template.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CreateSurveyPage;
