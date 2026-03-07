import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import api from '../../services/api';
import { useParams } from 'react-router-dom';

const PracticeArena = () => {
    const { topic } = useParams(); // URL'den konuyu al
    const [question, setQuestion] = useState(null);
    const [userCode, setUserCode] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(false);

    // 1. Rastgele Bir Soru Getir
    const fetchQuestion = async () => {
        try {
            setFeedback(null);
            const res = await api.get(`/questions/random?topic=${topic || ''}&lang=java`);
            if (res.data.data) {
                setQuestion(res.data.data);
                setUserCode(res.data.data.code_snippet || '// Kodunu buraya yaz...');
            }
        } catch (error) {
            console.error('Soru getirilemedi:', error);
            alert('Soru yüklenemedi. Bu konuda henüz soru olmayabilir.');
        }
    };

    useEffect(() => { 
        fetchQuestion(); 
    }, [topic]);

    // 2. Kodu Gönder ve Kontrol Et
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await api.post('/cs/submit-practice', {
                questionId: question.question_id,
                userCode: userCode
            });
            setFeedback(res.data.data);
        } catch (error) {
            console.error('Kod değerlendirilemedi:', error);
            alert("Hata oluştu: " + (error.response?.data?.message || 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    if (!question) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                    <p className="text-xl">Soru yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 shadow-lg">
                <div>
                    <h2 className="font-bold text-xl text-cyan-400">🚀 Java Practice Arena</h2>
                    <p className="text-sm text-gray-400">{question.topic || 'AP Computer Science A'}</p>
                </div>
                <button 
                    onClick={fetchQuestion} 
                    className="text-sm bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
                >
                    <span>🔄</span> Sonraki Soru
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* SOL: Soru ve Sonuç */}
                <div className="w-1/3 p-6 overflow-y-auto border-r border-gray-700 bg-gray-800">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-yellow-600 text-xs font-bold rounded">
                                {question.difficulty_level?.toUpperCase() || 'MEDIUM'}
                            </span>
                            <span className="px-2 py-1 bg-blue-600 text-xs font-bold rounded">
                                {question.points || 10} puan
                            </span>
                        </div>
                        <h3 className="text-lg font-bold mb-3 text-cyan-300">📝 Görev:</h3>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{question.content_text}</p>
                    </div>

                    {/* İpucu Butonu */}
                    {question.hint && (
                        <details className="mb-6">
                            <summary className="cursor-pointer text-yellow-500 font-bold hover:text-yellow-400 transition">
                                💡 İpucu Al
                            </summary>
                            <p className="mt-2 text-sm text-gray-300 p-3 bg-gray-900 rounded-lg border border-yellow-500/30">
                                {question.hint}
                            </p>
                        </details>
                    )}

                    {/* AI Geri Bildirimi */}
                    {feedback && (
                        <div className={`p-4 rounded-xl border ${
                            feedback.isCorrect 
                                ? 'bg-green-900/50 border-green-500' 
                                : 'bg-red-900/50 border-red-500'
                        }`}>
                            <h4 className="font-bold mb-2 text-lg">
                                {feedback.isCorrect ? '🎉 Harika İş!' : '⚠️ Hata Var'}
                            </h4>
                            <p className="text-sm mb-3 leading-relaxed">{feedback.feedback}</p>
                            
                            <div className="bg-black p-3 rounded-lg font-mono text-xs text-green-400 overflow-x-auto">
                                <div className="text-gray-500 mb-1">CONSOLE OUTPUT:</div>
                                <pre className="whitespace-pre-wrap">{feedback.consoleOutput}</pre>
                            </div>

                            {feedback.isCorrect && (
                                <button 
                                    onClick={fetchQuestion} 
                                    className="mt-4 w-full bg-green-600 py-2 rounded-lg font-bold hover:bg-green-700 transition"
                                >
                                    ✅ Sıradaki Soruya Geç
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* SAĞ: Editör */}
                <div className="w-2/3 flex flex-col">
                    <div className="flex-1">
                        <Editor
                            height="100%"
                            defaultLanguage="java"
                            theme="vs-dark"
                            value={userCode}
                            onChange={(value) => setUserCode(value || '')}
                            options={{ 
                                fontSize: 16, 
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 2
                            }}
                        />
                    </div>
                    <div className="bg-gray-800 p-4 border-t border-gray-700 flex justify-between items-center">
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Main.java
                        </div>
                        <button 
                            onClick={handleSubmit} 
                            disabled={loading}
                            className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                                loading 
                                    ? 'bg-gray-600 cursor-not-allowed' 
                                    : 'bg-cyan-600 hover:bg-cyan-500 hover:shadow-cyan-500/50'
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Analiz Ediliyor...
                                </span>
                            ) : (
                                '▶ Kodu Çalıştır'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PracticeArena;
