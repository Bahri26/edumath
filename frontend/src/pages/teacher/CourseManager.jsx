import React, { useState } from 'react';
import api from '../../services/api';

const CourseManager = () => {
    const [activeMode, setActiveMode] = useState('material'); // 'material' veya 'assignment'
    const [materialForm, setMaterialForm] = useState({ 
        title: '', 
        content: '', 
        type: 'summary', 
        lessonId: 1 // Default: AP CS (course_enrollments'taki lesson_id)
    });
    const [assignmentForm, setAssignmentForm] = useState({
        title: '',
        description: '',
        dueDate: '',
        lessonId: 1
    });
    const [aiLoading, setAiLoading] = useState(false);

    // AI ile Özet Oluştur
    const handleGenerateAI = async () => {
        if (!materialForm.title) { alert('x'); return; }
        setAiLoading(true);
        try {
            const res = await api.post('/ai/generate-material', { title: materialForm.title });
            setMaterialForm({ ...materialForm, content: res.data.data.htmlString });
        } catch (e) { alert('x'); }
        setAiLoading(false);
    };

    const handleSaveMaterial = async () => {
        if (!materialForm.title || !materialForm.content) {
            alert('❌ Başlık ve içerik zorunludur!');
            return;
        }

        try {
            await api.post('/study/material', materialForm);
            alert("✅ İçerik başarıyla yayınlandı!");
            // Formu temizle
            setMaterialForm({ title: '', content: '', type: 'summary', lessonId: 1 });
        } catch (error) {
            console.error('Materyal eklenemedi:', error);
            alert('❌ Materyal eklenemedi.');
        }
    };

    const handleSaveAssignment = async () => {
        if (!assignmentForm.title || !assignmentForm.description || !assignmentForm.dueDate) {
            alert('❌ Tüm alanları doldurun!');
            return;
        }

        try {
            await api.post('/study/assignment', assignmentForm);
            alert("✅ Ödev öğrencilere başarıyla atandı!");
            // Formu temizle
            setAssignmentForm({ title: '', description: '', dueDate: '', lessonId: 1 });
        } catch (error) {
            console.error('Ödev oluşturulamadı:', error);
            alert('❌ Ödev oluşturulamadı.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">👨‍🏫 Ders İçeriği Yönetimi</h1>
                    <p className="text-gray-500">Öğrencilere materyal ve ödev ekle</p>
                </header>

                {/* Mod Seçici */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveMode('material')}
                        className={`flex-1 py-4 rounded-2xl font-bold text-lg transition ${
                            activeMode === 'material'
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        📚 Ders Materyali Ekle
                    </button>
                    <button
                        onClick={() => setActiveMode('assignment')}
                        className={`flex-1 py-4 rounded-2xl font-bold text-lg transition ${
                            activeMode === 'assignment'
                                ? 'bg-orange-600 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        📝 Ödev Oluştur
                    </button>
                </div>

                {/* MATERYAL EKLEME FORMU */}
                {activeMode === 'material' && (
                    <div className="bg-white rounded-3xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Yeni Ders İçeriği</h2>

                        <div className="grid gap-6">
                            <div>
                                <label className="font-bold text-gray-700 block mb-2">Ders Seçin</label>
                                <select
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                    value={materialForm.lessonId}
                                    onChange={e => setMaterialForm({...materialForm, lessonId: e.target.value})}
                                >
                                    <option value="1">AP Computer Science A</option>
                                    {/* Diğer dersler buraya eklenebilir */}
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-gray-700 block mb-2">İçerik Tipi</label>
                                <select
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                    value={materialForm.type}
                                    onChange={e => setMaterialForm({...materialForm, type: e.target.value})}
                                >
                                    <option value="summary">Özet</option>
                                    <option value="notes">Ders Notu</option>
                                    <option value="video">Video</option>
                                    <option value="code">Kod Örneği</option>
                                    <option value="pdf">PDF Döküman</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-gray-700 block mb-2">Başlık / Konu</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Örn: ArrayList Kullanımı"
                                    value={materialForm.title}
                                    onChange={e => setMaterialForm({...materialForm, title: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="font-bold text-gray-700 flex justify-between mb-2">
                                    <span>İçerik (HTML destekli)</span>
                                    <button 
                                        onClick={handleGenerateAI} 
                                        disabled={aiLoading}
                                        className="text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full flex items-center gap-1 hover:from-indigo-600 hover:to-purple-600 transition disabled:opacity-50"
                                    >
                                        {aiLoading ? '🤖 Yazılıyor...' : '✨ AI ile Özetle'}
                                    </button>
                                </label>
                                <textarea 
                                    className="w-full border border-gray-300 p-3 rounded-xl h-64 font-mono text-sm focus:ring-2 focus:ring-indigo-500"
                                    placeholder="HTML veya düz metin içeriği yazın..."
                                    value={materialForm.content}
                                    onChange={e => setMaterialForm({...materialForm, content: e.target.value})}
                                ></textarea>
                                <p className="text-xs text-gray-500 mt-2">
                                    💡 HTML etiketleri kullanabilirsiniz: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, &lt;pre&gt;&lt;code&gt;
                                </p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button 
                                    onClick={() => setMaterialForm({ title: '', content: '', type: 'summary', lessonId: 1 })}
                                    className="px-6 py-3 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200"
                                >
                                    Temizle
                                </button>
                                <button 
                                    onClick={handleSaveMaterial} 
                                    className="px-8 py-3 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700 shadow-lg"
                                >
                                    📤 Yayınla
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ÖDEV OLUŞTURMA FORMU */}
                {activeMode === 'assignment' && (
                    <div className="bg-white rounded-3xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Yeni Ödev Oluştur</h2>

                        <div className="grid gap-6">
                            <div>
                                <label className="font-bold text-gray-700 block mb-2">Ders Seçin</label>
                                <select
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-500"
                                    value={assignmentForm.lessonId}
                                    onChange={e => setAssignmentForm({...assignmentForm, lessonId: e.target.value})}
                                >
                                    <option value="1">AP Computer Science A</option>
                                </select>
                            </div>

                            <div>
                                <label className="font-bold text-gray-700 block mb-2">Ödev Başlığı</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-500"
                                    placeholder="Örn: Fibonacci Serisi Projesi"
                                    value={assignmentForm.title}
                                    onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="font-bold text-gray-700 block mb-2">Açıklama / Talimatlar</label>
                                <textarea 
                                    className="w-full border border-gray-300 p-3 rounded-xl h-40 focus:ring-2 focus:ring-orange-500"
                                    placeholder="Öğrencilerin ne yapması gerektiğini detaylı açıklayın..."
                                    value={assignmentForm.description}
                                    onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})}
                                ></textarea>
                            </div>

                            <div>
                                <label className="font-bold text-gray-700 block mb-2">Son Teslim Tarihi</label>
                                <input 
                                    type="datetime-local" 
                                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-500"
                                    value={assignmentForm.dueDate}
                                    onChange={e => setAssignmentForm({...assignmentForm, dueDate: e.target.value})}
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button 
                                    onClick={() => setAssignmentForm({ title: '', description: '', dueDate: '', lessonId: 1 })}
                                    className="px-6 py-3 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200"
                                >
                                    Temizle
                                </button>
                                <button 
                                    onClick={handleSaveAssignment} 
                                    className="px-8 py-3 rounded-xl bg-orange-600 font-bold text-white hover:bg-orange-700 shadow-lg"
                                >
                                    📋 Ödevi Ata
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseManager;
