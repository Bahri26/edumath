import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { useTheme } from '../../hooks/useTheme';

/**
 * 🤖 ADMIN AI CONSOLE
 * Terminal tarzı AI sohbet arayüzü
 */
export default function AdminAIConsole() {
    const { theme } = useTheme();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { 
            role: 'ai', 
            text: '🤖 EduMath AI Operations v2.0.1 Hazır.\n\n✅ Sistem bağlantısı aktif\n✅ Veritabanı senkronizasyonu tamamlandı\n✅ Gemini 2.5 Flash (fallback destekli) yüklendi\n\nSistem analizi yapabilir, hata tespit edebilir veya tavsiyeler sunabilirim. Lütfen sorunuzu yazın.' 
        }
    ]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/admin/ai-assistant', { message: input });
            const aiResponse = res.data.data.answer || 'Yanıt alınamadı.';
            
            setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Bağlantı hatası. Lütfen tekrar deneyin.';
            setMessages(prev => [...prev, { role: 'ai', text: `⚠️ ${errorMsg}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickCommand = (command) => {
        setInput(command);
    };

    return (
        <div className={`rounded-2xl shadow-2xl border flex flex-col h-screen max-h-[700px] overflow-hidden transition-colors ${
            theme === 'dark'
                ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700'
                : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200'
        }`}>
            
            {/* Header */}
            <div className={`p-5 flex items-center justify-between border-b transition-colors ${
                theme === 'dark'
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-slate-200 border-slate-300'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <h3 className={`font-mono font-bold text-lg ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                        🤖 EduMath AI Operations
                    </h3>
                </div>
                <span className={`text-xs font-mono px-3 py-1 rounded border ${
                    theme === 'dark'
                        ? 'border-slate-600 text-slate-400 bg-slate-800'
                        : 'border-slate-400 text-slate-600 bg-slate-100'
                }`}>
                    v2.0.1 Connected
                </span>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 overflow-y-auto p-6 space-y-4 font-mono text-sm ${
                theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'
            }`}>
                {messages.map((msg, index) => (
                    <div 
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-xs lg:max-w-xl px-4 py-3 rounded-xl transition-all ${
                            msg.role === 'user' 
                                ? 'bg-indigo-600 dark:bg-indigo-700 text-white rounded-br-none shadow-lg' 
                                : theme === 'dark'
                                ? 'bg-slate-800 text-green-400 border border-slate-700 rounded-bl-none shadow-lg'
                                : 'bg-white text-green-700 border border-slate-300 rounded-bl-none shadow-md'
                        }`}>
                            {msg.role === 'ai' && (
                                <div className={`text-xs mb-2 font-bold ${
                                    theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                                }`}>
                                    $ AI_AGENT → RESPONSE
                                </div>
                            )}
                            <div className="whitespace-pre-wrap break-words leading-relaxed">
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))}
                
                {loading && (
                    <div className="flex justify-start">
                        <div className={`px-4 py-3 rounded-xl flex gap-2 ${
                            theme === 'dark'
                                ? 'bg-slate-800 text-green-400'
                                : 'bg-white text-green-700 border border-slate-300'
                        }`}>
                            <span className="animate-bounce">●</span>
                            <span className="animate-bounce animation-delay-100">●</span>
                            <span className="animate-bounce animation-delay-200">●</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Commands */}
            {messages.length <= 1 && (
                <div className={`px-6 py-4 border-t transition-colors ${
                    theme === 'dark'
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-slate-100 border-slate-300'
                }`}>
                    <p className={`text-xs mb-3 font-semibold ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                        💡 Hızlı Komutlar:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleQuickCommand('Sistem durumunu kontrol et')}
                            className={`text-xs py-2 px-3 rounded font-mono transition-all hover:scale-105 ${
                                theme === 'dark'
                                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            📊 Sistem Durumu
                        </button>
                        <button
                            onClick={() => handleQuickCommand('Bugün kaç hata oluştu?')}
                            className={`text-xs py-2 px-3 rounded font-mono transition-all hover:scale-105 ${
                                theme === 'dark'
                                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            ⚠️ Hataları Listele
                        </button>
                        <button
                            onClick={() => handleQuickCommand('Son 5 login işlemi neler?')}
                            className={`text-xs py-2 px-3 rounded font-mono transition-all hover:scale-105 ${
                                theme === 'dark'
                                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            👥 Login Aktivitesi
                        </button>
                        <button
                            onClick={() => handleQuickCommand('Yavaş sorguları analiz et')}
                            className={`text-xs py-2 px-3 rounded font-mono transition-all hover:scale-105 ${
                                theme === 'dark'
                                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                            ⚡ Performans
                        </button>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className={`p-5 border-t transition-colors ${
                theme === 'dark'
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-slate-100 border-slate-300'
            }`}>
                <div className="flex gap-3 mb-3">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Komut girin (örn: 'Son hataları analiz et')..."
                        className={`flex-1 px-4 py-3 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                            theme === 'dark'
                                ? 'bg-slate-900 text-white border border-slate-700'
                                : 'bg-white text-slate-900 border border-slate-300'
                        }`}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className={`px-6 py-3 rounded-lg font-bold transition-all font-mono text-sm ${
                            loading || !input.trim()
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:scale-105'
                        }`}
                    >
                        {loading ? '⏳' : '→'}
                    </button>
                </div>
                <div className={`text-xs text-center font-mono ${
                    theme === 'dark' ? 'text-slate-500' : 'text-slate-600'
                }`}>
                    Gemini 2.5 Flash + fallback tarafından desteklenmektedir • Hassas verileri paylaşırken dikkatli olun
                </div>
            </div>
        </div>
    );
}
