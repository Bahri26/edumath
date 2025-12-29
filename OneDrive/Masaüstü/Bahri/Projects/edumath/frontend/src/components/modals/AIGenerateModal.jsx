import React, { useState } from 'react';
import { Sparkles, Loader2, Check, X, BookOpen, AlertCircle } from 'lucide-react';
import apiClient from '../../services/api'; // API servisinizi import edin

export default function AIGenerateModal({ isOpen, onClose, onAddQuestions, classLevel }) {
  // --- States ---
  const [step, setStep] = useState('input'); // 'input' | 'loading' | 'preview'
  const [inputText, setInputText] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Orta');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);

  // --- Handlers ---
  const handleGenerate = async () => {
    if (!inputText.trim()) return;
    
    setStep('loading');
    try {
      // Backend'e istek atıyoruz (Bu endpoint'i backend'de oluşturmalısınız)
      const res = await apiClient.post('/teacher/generate-questions-from-text', {
        text: inputText,
        count: questionCount,
        difficulty,
        classLevel
      });

      // Gelen soruların formatı: [{text: "...", options: [...], correctAnswer: "A", ...}]
      if (res.data && Array.isArray(res.data)) {
        setGeneratedQuestions(res.data);
        setStep('preview');
      } else {
        alert("Soru üretilemedi, lütfen tekrar deneyin.");
        setStep('input');
      }
    } catch (error) {
      console.error(error);
      alert("AI servisinde hata oluştu.");
      setStep('input');
    }
  };

  const toggleSelect = (index) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleAddSelected = () => {
    const selectedQuestions = generatedQuestions.filter((_, i) => selectedIndices.includes(i));
    // Seçilen sorulara zorluk seviyesini ve dersi ekleyip ana sayfaya gönderiyoruz
    const formattedQuestions = selectedQuestions.map(q => ({
        ...q,
        _id: `temp_${Date.now()}_${Math.random()}`, // Geçici ID
        difficulty: difficulty, // Seçilen zorluğu ata
        subject: "AI Üretimi" // Veya inputtan çıkarılabilir
    }));
    
    onAddQuestions(formattedQuestions);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep('input');
    setInputText('');
    setGeneratedQuestions([]);
    setSelectedIndices([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
            <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                <Sparkles size={20} />
            </div>
            <div>
                <h3 className="font-bold text-lg leading-tight">AI Soru Üretici</h3>
                <p className="text-xs opacity-70 font-medium">Metinden veya konudan soru oluştur</p>
            </div>
          </div>
          <button onClick={resetAndClose} className="text-slate-400 hover:text-rose-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* STEP 1: INPUT */}
          {step === 'input' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Metin, Paragraf veya Konu Başlığı
                </label>
                <textarea
                  className="w-full h-40 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium text-slate-700 dark:text-slate-200"
                  placeholder="Buraya bir metin yapıştırın veya '2. Dünya Savaşı nedenleri' gibi bir konu girin..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zorluk</label>
                    <select 
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium outline-none focus:border-indigo-500"
                    >
                        <option>Kolay</option>
                        <option>Orta</option>
                        <option>Zor</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Soru Sayısı</label>
                    <select 
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium outline-none focus:border-indigo-500"
                    >
                        <option value={3}>3 Soru</option>
                        <option value={5}>5 Soru</option>
                        <option value={10}>10 Soru</option>
                    </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LOADING */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={20} />
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mt-6">Yapay Zeka Çalışıyor...</h4>
                <p className="text-slate-500 mt-2 max-w-xs mx-auto">Sorular analiz ediliyor ve şıklar oluşturuluyor. Bu işlem birkaç saniye sürebilir.</p>
            </div>
          )}

          {/* STEP 3: PREVIEW */}
          {step === 'preview' && (
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-slate-500">Bulunan Sorular ({generatedQuestions.length})</p>
                    <button 
                        onClick={() => setSelectedIndices(generatedQuestions.map((_, i) => i))}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                        Tümünü Seç
                    </button>
                </div>
                {generatedQuestions.map((q, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => toggleSelect(idx)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedIndices.includes(idx) 
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                            : 'border-slate-100 dark:border-slate-700 hover:border-indigo-300'
                        }`}
                    >
                        <div className="flex gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                                selectedIndices.includes(idx) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                            }`}>
                                {selectedIndices.includes(idx) && <Check size={14} />}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm mb-2">{q.text}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {q.options.map((opt, i) => (
                                        <div key={i} className={`text-xs p-2 rounded border ${
                                            opt === q.correctAnswer || opt.startsWith(q.correctAnswer) // Basit kontrol
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                            : 'bg-white border-slate-100 text-slate-500'
                                        }`}>
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
            {step === 'input' && (
                <button 
                    onClick={handleGenerate}
                    disabled={!inputText.trim()}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/30"
                >
                    <Sparkles size={18} /> Soruları Oluştur
                </button>
            )}
            
            {step === 'preview' && (
                <>
                    <button 
                        onClick={() => setStep('input')}
                        className="px-4 py-2 text-slate-500 hover:bg-slate-200 rounded-lg font-bold transition-colors"
                    >
                        Geri Dön
                    </button>
                    <button 
                        onClick={handleAddSelected}
                        disabled={selectedIndices.length === 0}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/30"
                    >
                        <BookOpen size={18} /> {selectedIndices.length} Soruyu Ekle
                    </button>
                </>
            )}
        </div>
      </div>
    </div>
  );
}