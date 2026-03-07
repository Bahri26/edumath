import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

const StudyRoom = () => {
    const { lessonId } = useParams(); // URL'den ders ID'sini al (örn: /study/1)
    const [data, setData] = useState({ materials: [], assignments: [] });
    const [activeTab, setActiveTab] = useState('notes');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/study/materials/${lessonId}`);
                setData(res.data.data);
            } catch (error) {
                console.error('Materyal getirilemedi:', error);
                alert('Ders materyalleri yüklenemedi.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [lessonId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Ders materyalleri yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">📚 Çalışma Odası</h1>
                <p className="text-gray-500">Ders notlarını incele ve görevlerini tamamla.</p>
            </header>

            {/* Sekmeler */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('notes')} 
                    className={`pb-2 px-4 font-bold transition ${
                        activeTab === 'notes' 
                            ? 'text-indigo-600 border-b-2 border-indigo-600' 
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    📖 Ders Notları & Özetler
                </button>
                <button 
                    onClick={() => setActiveTab('homework')} 
                    className={`pb-2 px-4 font-bold transition ${
                        activeTab === 'homework' 
                            ? 'text-indigo-600 border-b-2 border-indigo-600' 
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    📝 Ödevlerim 
                    {data.assignments.length > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                            {data.assignments.length}
                        </span>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SOL: İÇERİK ALANI */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'notes' && (
                        <>
                            {data.materials.length === 0 ? (
                                <div className="bg-white p-12 rounded-2xl text-center">
                                    <p className="text-gray-500 text-lg">Bu ders için henüz materyal eklenmemiş.</p>
                                </div>
                            ) : (
                                data.materials.map(item => (
                                    <div 
                                        key={item.material_id} 
                                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                                            <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded uppercase">
                                                {item.type}
                                            </span>
                                        </div>
                                        <div 
                                            className="prose max-w-none text-gray-600"
                                            dangerouslySetInnerHTML={{ __html: item.content }}
                                        />
                                        {item.type === 'video' && (
                                            <button className="mt-4 text-indigo-600 font-bold underline hover:text-indigo-700">
                                                Videoyu İzle →
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </>
                    )}

                    {activeTab === 'homework' && (
                        <>
                            {data.assignments.length === 0 ? (
                                <div className="bg-white p-12 rounded-2xl text-center">
                                    <p className="text-gray-500 text-lg">Henüz ödev atanmamış. 🎉</p>
                                </div>
                            ) : (
                                data.assignments.map(hw => (
                                    <AssignmentCard key={hw.assignment_id} hw={hw} />
                                ))
                            )}
                        </>
                    )}
                </div>

                {/* SAĞ: AI ASİSTAN */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white sticky top-6 shadow-2xl">
                        <h3 className="text-xl font-bold mb-2">🤖 Gemini Asistan</h3>
                        <p className="text-indigo-100 text-sm mb-4">
                            Bu konuyu anlamadın mı? Bana sor, senin için özetleyeyim veya örnek kod yazayım.
                        </p>
                        <button className="w-full bg-white text-indigo-700 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-100 transition">
                            Sohbeti Başlat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AssignmentCard = ({ hw }) => {
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    
    const submit = async () => {
        if (!answer.trim()) {
            alert('Lütfen cevabınızı yazın!');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/study/submit-assignment', { 
                assignmentId: hw.assignment_id, 
                text: answer 
            });
            alert('✅ Ödev başarıyla gönderildi!');
            setAnswer('');
        } catch (error) {
            console.error('Ödev gönderilemedi:', error);
            alert('❌ Ödev gönderilemedi. Lütfen tekrar deneyin.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-orange-500">
            <h3 className="font-bold text-lg text-gray-800">{hw.title}</h3>
            <p className="text-sm text-gray-500 mb-2">
                📅 Son Teslim: {new Date(hw.due_date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </p>
            <p className="text-gray-700 mb-4 bg-gray-50 p-3 rounded">
                {hw.description}
            </p>
            
            <textarea 
                className="w-full border border-gray-300 p-3 rounded-lg mb-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" 
                placeholder="Cevabınızı veya proje linkinizi buraya yapıştırın..."
                rows="4"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
            ></textarea>
            <button 
                onClick={submit} 
                disabled={submitting}
                className={`w-full py-2 rounded-lg font-bold text-sm transition ${
                    submitting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
            >
                {submitting ? 'Gönderiliyor...' : '📤 Ödevi Teslim Et'}
            </button>
        </div>
    );
};

export default StudyRoom;
