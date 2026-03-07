import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import api from '../../services/api';

const CodeEditorQuestion = ({ question }) => {
    const [userCode, setUserCode] = useState(question.code_snippet || '// Kodunu buraya yaz...');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);

    // Kodu Çalıştır / Kontrol Et (AI ile)
    const handleRunCode = async () => {
        setLoading(true);
        setOutput("Kod derleniyor ve analiz ediliyor...");

        try {
            // Backend'e kodu gönderip Gemini ile kontrol ettireceğiz
            const res = await api.post('/cs/check-code', {
                code: userCode,
                questionId: question.id
            });
            
            setOutput(res.data.data.feedback); // AI'dan gelen geri bildirim
        } catch (error) {
            setOutput("Hata: Kod servisine ulaşılamadı.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-4 h-[600px]">
            {/* SOL: Soru Metni */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-800 mb-4">AP CSA: {question.topic}</h3>
                <div className="prose text-gray-600 mb-6">
                    {question.content_text}
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                    <strong>İpucu:</strong> Java'da `System.out.println()` kullanmayı unutma.
                </div>
            </div>

            {/* SAĞ: Kod Editörü */}
            <div className="flex flex-col bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center bg-[#252526] px-4 py-2 border-b border-[#333]">
                    <span className="text-xs text-gray-400">Main.java</span>
                    <button 
                        onClick={handleRunCode}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-xs font-bold transition flex items-center gap-2"
                    >
                        {loading ? 'Çalışıyor...' : '▶ Çalıştır'}
                    </button>
                </div>
                
                <Editor
                    height="60%"
                    defaultLanguage="java"
                    theme="vs-dark"
                    value={userCode}
                    onChange={(value) => setUserCode(value)}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        automaticLayout: true
                    }}
                />

                {/* Terminal / Çıktı Ekranı */}
                <div className="flex-1 bg-black text-green-400 p-4 font-mono text-sm border-t border-[#333] overflow-y-auto">
                    <div className="text-gray-500 text-xs mb-2">TERMINAL</div>
                    <pre className="whitespace-pre-wrap">{output}</pre>
                </div>
            </div>
        </div>
    );
};

export default CodeEditorQuestion;
