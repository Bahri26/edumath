import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, Wand2, FileText, ArrowRight, Edit3, Check, RefreshCw, Sparkles, Binary } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import Tesseract from 'tesseract.js';
import { smartParseImage, solveTextQuestion } from '../../services/aiService';
import { parseTextToQuestion } from '../../utils/parseSmartPaste';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

export default function SmartPasteModal({ onClose, onSuccess }) {
  const { showToast } = useToast();
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState({
    text: '',
    options: ['', '', '', '', ''],
    correctAnswer: '',
    solution: '',
    imagePosition: 'top'
  });
  const [solving, setSolving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [optionImages, setOptionImages] = useState(Array(5).fill({ file: null, preview: '' }));
  const [autoSolveEnabled, setAutoSolveEnabled] = useState(true);

  // Body Scroll Lock - Ekranın kaymasını engeller
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const renderWithLatex = (text) => {
    if (!text) return null;
    const parts = String(text).split(/(\$[^$]+\$)/g);
    return (
      <span className="leading-relaxed">
        {parts.map((part, index) => (
          part.startsWith('$') && part.endsWith('$') 
            ? <span key={index} className="mx-0.5 inline-block px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border border-indigo-100 dark:border-indigo-500/20 shadow-sm"><InlineMath math={part.slice(1, -1)} /></span>
            : <span key={index}>{part}</span>
        ))}
      </span>
    );
  };

  const handleImage = async (file) => {
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const res = await smartParseImage(file);
      if (res?.success && res?.data) {
        setExtractedData({
          text: res.data.text || '',
          options: (res.data.options || ['', '', '', '', '']).slice(0, 5),
          correctAnswer: res.data.correctAnswer || '',
          solution: res.data.solution || '',
          imagePosition: 'top'
        });
        showToast('AI metni başarıyla ayrıştırdı.', 'success');
      } else {
        const { data: { text } } = await Tesseract.recognize(file, 'tur+eng');
        const parsed = parseTextToQuestion(text);
        setExtractedData({ ...parsed, options: parsed.options.slice(0, 5) });
        setEditMode(true);
      }
    } catch (e) {
      showToast('İşlem sırasında bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto p-3 sm:p-4 pt-20 md:pt-28">
      {/* Arka Plan Overlay (Siyah değil, uygulama renklerine uygun bulanıklık) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-200/40 dark:bg-slate-900/60 backdrop-blur-md"
      />
      
      {/* Modal Ana Gövdesi */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-[94vw] sm:w-[92vw] max-w-5xl max-h-[88vh] bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden border border-white dark:border-slate-800 flex flex-col mb-8 mt-10"
      >
        
        {/* Header - Sabit */}
        <div className="shrink-0 bg-indigo-600 dark:bg-indigo-900 px-5 py-4 md:px-6 md:py-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Wand2 size={24} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black">AI Akıllı Dönüştürücü</h2>
              <p className="text-indigo-100/70 text-xs">Görseli forma aktarmak için yükleyin veya yapıştırın.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-transform hover:rotate-90">
            <X size={24} />
          </button>
        </div>

        {/* İçerik Alanı - Kaydırılabilir */}
        <div className="flex-1 overflow-y-auto p-5 md:p-7 custom-scrollbar bg-slate-50/50 dark:bg-transparent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 h-full min-h-[440px]">
            
            {/* Sol: Yükleme Paneli */}
            <div className="flex flex-col gap-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <Binary size={14} /> Girdi Kaynağı
              </label>
              <div className={`relative flex-1 min-h-[260px] rounded-[1.75rem] border-2 border-dashed transition-all overflow-hidden ${imagePreview ? 'border-indigo-500 bg-white' : 'border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/40'}`}>
                {imagePreview ? (
                  <div className="h-full p-4 flex flex-col">
                    <img src={imagePreview} alt="Preview" className="flex-1 object-contain rounded-xl" />
                    <button onClick={() => setImagePreview('')} className="mt-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">Görseli Kaldır</button>
                  </div>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer p-6">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                      <UploadCloud size={32} />
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-200">Görsel Yükle veya Yapıştır</p>
                    <p className="text-xs text-slate-400 mt-1 italic">PNG, JPG desteklenir</p>
                    <input type="file" accept="image/*" onChange={(e) => handleImage(e.target.files[0])} className="hidden" />
                  </label>
                )}
                {loading && (
                  <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center">
                    <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                    <p className="text-xs font-black text-indigo-600 uppercase">AI Metni Çözümlüyor...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sağ: Soru Oluşturma Paneli */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Soru Detayları
                </label>
                {extractedData.text && (
                  <button onClick={() => setEditMode(!editMode)} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                    {editMode ? <><Check size={14}/> Kaydet</> : <><Edit3 size={14}/> Düzenle</>}
                  </button>
                )}
              </div>
              
              <div className="flex-1 min-h-[260px] bg-white dark:bg-slate-800/40 rounded-[1.75rem] border border-slate-200 dark:border-slate-700 p-5 md:p-6 shadow-inner">
                <AnimatePresence mode="wait">
                  {extractedData.text ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 h-full overflow-y-auto pr-2 custom-scrollbar">
                      {editMode ? (
                        <textarea 
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm outline-none focus:ring-2 ring-indigo-500/20"
                          value={extractedData.text}
                          onChange={(e) => setExtractedData({...extractedData, text: e.target.value})}
                          rows={4}
                        />
                      ) : (
                        <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                          <p className="text-sm font-medium leading-relaxed">{extractedData.text}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 gap-2">
                        {extractedData.options.map((opt, i) => (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${extractedData.correctAnswer === opt ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                            <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">{String.fromCharCode(65+i)}</span>
                            <span className="text-xs font-medium flex-1">{opt || '...'}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                      <Sparkles size={40} className="mb-4 opacity-20" />
                      <p className="text-xs italic max-w-[200px]">Görsel yüklendiğinde soru burada otomatik oluşacak.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>

        {/* Footer - Sabit */}
        <div className="shrink-0 p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-4">
          <button onClick={onClose} className="px-8 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">Vazgeç</button>
          <button 
            disabled={!extractedData.text || loading}
            onClick={() => { onSuccess(extractedData); onClose(); }}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            Verileri Aktar <ArrowRight size={16} />
          </button>
        </div>
        
      </motion.div>
    </div>
  );
}