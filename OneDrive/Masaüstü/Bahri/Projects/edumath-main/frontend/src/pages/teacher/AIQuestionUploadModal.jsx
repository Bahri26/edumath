import React, { useState } from 'react';
import { Loader2, Upload, Trash2, CheckCircle, FileText, X } from 'lucide-react';
import api from '../../services/api'; // Axios instance

export default function AIQuestionUploadModal({ isOpen, onClose, onQuestionsReady }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [edited, setEdited] = useState([]);

  // Dosya seçilince state'i güncelle
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setQuestions([]);
      setEdited([]);
      setError('');
    }
  };

  // Backend'e (Gemini Service) gönder
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file); // Backend'de 'upload.single("file")' ile aynı isimde olmalı

      // DÜZELTME 1: Endpoint adresi backend ile eşleştirildi
      const res = await api.post('/upload/pdf-ai', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // DÜZELTME 2: Backend'den dönen { data: [...] } yapısına uygun okuma
      const aiQuestions = res.data.data || [];
      
      if (aiQuestions.length === 0) {
        setError('Soru bulunamadı veya analiz edilemedi.');
      } else {
        setQuestions(aiQuestions);
        setEdited(aiQuestions);
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'AI analiz sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Form içindeki alanları düzenleme
  const handleEdit = (idx, field, value) => {
    setEdited(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  // İstenmeyen soruyu listeden çıkarma
  const handleRemove = (idx) => {
    setEdited(prev => prev.filter((_, i) => i !== idx));
  };

  // Son haliyle ana sayfaya aktarma (veya veritabanına kaydetme)
  const handleSave = async () => {
    // Burada dilersen direkt veritabanına da kaydedebilirsin:
    // await api.post('/questions/bulk', { questions: edited });
    
    onQuestionsReady(edited); // Parent bileşene (TeacherExamsPage) gönder
    onClose();
    setFile(null);
    setEdited([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <SparklesIcon className="text-purple-500" /> AI ile PDF Analizi
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gemini 1.5 Flash ile soruları otomatik ayıkla</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-900/30">
          
          {!file || (file && questions.length === 0 && !loading) ? (
            // Adım 1: Dosya Seçimi
            <div className="flex flex-col items-center justify-center h-full py-10 border-2 border-dashed border-indigo-300 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors">
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="ai-pdf-upload" />
              <label htmlFor="ai-pdf-upload" className="cursor-pointer flex flex-col items-center gap-4 w-full h-full justify-center">
                <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                  <Upload size={40} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">PDF Dosyasını Buraya Bırakın</p>
                  <p className="text-sm text-slate-500">veya dosya seçmek için tıklayın</p>
                </div>
                {file && (
                  <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                    <FileText size={16} /> {file.name}
                  </div>
                )}
              </label>
              
              {file && (
                <button 
                  onClick={handleUpload} 
                  className="mt-6 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
                >
                  <SparklesIcon size={20} /> Analizi Başlat
                </button>
              )}
              
              {error && <div className="mt-4 text-rose-500 bg-rose-50 px-4 py-2 rounded-lg text-sm font-medium">{error}</div>}
            </div>
          ) : loading ? (
            // Adım 2: Yükleniyor
            <div className="flex flex-col items-center justify-center h-full py-20 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <SparklesIcon size={24} className="text-purple-500 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">Yapay Zeka Çalışıyor...</h3>
                <p className="text-slate-500">Görseller taranıyor, metinler okunuyor ve sorular ayıklanıyor.</p>
                <p className="text-xs text-slate-400">Bu işlem PDF boyutuna göre 10-30 saniye sürebilir.</p>
              </div>
            </div>
          ) : (
            // Adım 3: Düzenleme ve Onay
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">
                  {edited.length} Soru Bulundu
                </h3>
                <div className="text-sm text-slate-500">
                  Lütfen metinleri kontrol edin ve hataları düzeltin.
                </div>
              </div>

              <div className="grid gap-6">
                {edited.map((q, i) => (
                  <div key={i} className="group bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-400 transition-all relative">
                    <button 
                      onClick={() => handleRemove(i)} 
                      className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Bu soruyu sil"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="space-y-4">
                      {/* Soru Metni */}
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Soru Metni</label>
                        <textarea
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[80px]"
                          value={q.text}
                          onChange={e => handleEdit(i, 'text', e.target.value)}
                        />
                      </div>

                      {/* Şıklar */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options && q.options.map((opt, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-500">
                              {String.fromCharCode(65 + j)}
                            </span>
                            <input
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={opt}
                              onChange={e => {
                                const newOpts = [...q.options];
                                newOpts[j] = e.target.value;
                                handleEdit(i, 'options', newOpts);
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Meta Veriler */}
                      <div className="flex flex-wrap gap-3 pt-2">
                        <div className="flex-1 min-w-[120px]">
                           <input
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={q.correctAnswer || ''}
                            placeholder="Doğru Cevap (Örn: A)"
                            onChange={e => handleEdit(i, 'correctAnswer', e.target.value)}
                          />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                           <input
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs font-bold text-amber-600 focus:ring-2 focus:ring-amber-500 outline-none"
                            value={q.difficulty || ''}
                            placeholder="Zorluk (Kolay/Orta/Zor)"
                            onChange={e => handleEdit(i, 'difficulty', e.target.value)}
                          />
                        </div>
                        <div className="flex-[2] min-w-[200px]">
                           <input
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-2 text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={q.subject || ''}
                            placeholder="Konu (Matematik, Örüntüler vb.)"
                            onChange={e => handleEdit(i, 'subject', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {questions.length > 0 && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
            <button 
              onClick={() => { setFile(null); setQuestions([]); }} 
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Vazgeç
            </button>
            <button 
              onClick={handleSave} 
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle size={20} />
              {edited.length} Soruyu İçe Aktar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Basit ikon bileşeni (Lucide'da bazen isim karışıklığı olabiliyor)
const SparklesIcon = ({ className, size }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
);