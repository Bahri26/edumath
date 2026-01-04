import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import apiClient from '../../services/api'; // Axios servisini çağır

const Chatbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Merhaba! Ben Edumath Asistanı. Matematik soruların veya site hakkında yardım için buradayım! 👋", sender: 'bot' }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Otomatik Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Kullanıcı mesajını ekrana bas
    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true); // "Yazıyor..." animasyonunu aç

    try {
      // 2. Backend'e istek at (Gerçek AI)
      const res = await apiClient.post('/chat', { message: userMsg.text });
      
      // 3. Gelen cevabı ekrana bas
      const botMsg = { 
        id: Date.now() + 1, 
        text: res.data.reply, // Backend'den gelen 'reply'
        sender: 'bot' 
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      // Hata olursa
      const errorMsg = { 
        id: Date.now() + 2, 
        text: "Bağlantı hatası oluştu. Lütfen tekrar dene.", 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false); // Animasyonu kapat
    }
  };

  // ... (Geri kalan render kısmı aynı, sadece handleSend değişti) ...
  
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* PENCERE */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-scale-in origin-bottom-right">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg"><Bot size={20} /></div>
              <div>
                <h3 className="font-bold text-sm">Edumath AI</h3>
                <p className="text-xs text-indigo-100 flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Çevrimiçi</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors"><X size={20} /></button>
          </div>

          {/* Mesajlar */}
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
                }`}>
                  {/* Markdown desteği yoksa düz metin */}
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Yazıyor Animasyonu */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <input 
              type="text" 
              placeholder="Bir soru sor..." 
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors"
            >
              {isTyping ? <Loader2 size={20} className="animate-spin"/> : <Send size={20} />}
            </button>
          </form>

        </div>
      )}

      {/* FAB BUTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-110'}`}
      >
        {isOpen ? <X size={24} className="text-white" /> : (
          <div className="relative">
            <Sparkles size={24} className="text-white absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <MessageSquare size={28} className="text-white" />
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
          </div>
        )}
      </button>

    </div>
  );
};

export default Chatbox;