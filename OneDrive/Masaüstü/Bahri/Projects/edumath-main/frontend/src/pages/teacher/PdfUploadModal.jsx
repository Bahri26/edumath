import React, { useState } from 'react';
import { Loader2, Upload, Trash2, CheckCircle, FileText, AlertTriangle, X } from 'lucide-react';
import api from '../../services/api'; // Axios instance

export default function PdfUploadModal({ isOpen, onClose, onQuestionsReady }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]); // Ham sorular
  const [selected, setSelected] = useState([]); // Seçili indeksler
  const [error, setError] = useState('');

  // Dosya Seçimi
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setQuestions([]);
      setSelected([]);
      setError('');
    }
  };

  // Backend'e Gönderme (Gemini API)
  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError('');
    setQuestions([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Backend Endpoint'ine istek atılıyor
      const res = await api.post('/upload/pdf-ai', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Backend'den { data: [...] } formatında cevap gelir
      const extractedQuestions = res.data.data || [];

      if (extractedQuestions.length === 0) {
        setError('PDF analiz edildi ancak soru bulunamadı.');
      } else {
        setQuestions(extractedQuestions);
        // Varsayılan olarak tüm soruları seç
        setSelected(extractedQuestions.map((_, i) => i));
      }

    } catch (err) {
      console.error("Upload Hatası:", err);
      // Hata mesajını kullanıcıya göster
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'PDF analiz edilemedi. Lütfen dosya boyutunu veya formatını kontrol edin.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Soru Seç/Kaldır
  const handleToggle = (idx) => {
    if (selected.includes(idx)) {
      setSelected(selected.filter(i => i !== idx));
    } else {
      setSelected([...selected, idx]);
    }
  };

  // Kaydet ve Ana Sayfaya Dön
  const handleSave = async () => {
    const toSave = selected.map(i => questions[i]);
    
    // İstersen burada direkt veritabanına da kaydedebilirsin
    // await api.post('/questions/bulk-create', { questions: toSave });
    
    onQuestionsReady(toSave); // Üst bileşene soruları gönder
    onClose();
    // State'i temizle
    setFile(null);
    setQuestions([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Upload className="text-indigo-600" size={24} /> 
              PDF Soru Aktarımı
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Yapay zeka ile PDF'teki soruları otomatik ayıkla</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {!file || (file && questions.length === 0 && !loading && !error) ? (
            // Durum 1: Dosya Yükleme Ekranı
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-indigo-200 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50/50 transition-colors relative">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                id="pdf-upload" 
              />
              <div className="flex flex-col items-center gap-3 pointer-events-none">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                  <Upload size={32} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">PDF Dosyasını Buraya Sürükleyin</p>
                  <p className="text-sm text-slate-500">veya seçmek için tıklayın</p>
                </div>
              </div>
              {file && (
                <div className="absolute bottom-4 flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 pointer-events-none">
                  <FileText size={14} className="text-indigo-500" /> {file.name}
                </div>
              )}
            </div>
          ) : loading ? (
            // Durum 2: Yükleniyor
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-indigo-600">AI</div>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700 dark:text-white">Analiz Ediliyor...</p>
                <p className="text-sm text-slate-500">Sorular görsel işleme ile ayıklanıyor, lütfen bekleyin.</p>
              </div>
            </div>
          ) : error ? (
            // Durum 3: Hata
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <div className="p-4 bg-rose-100 dark:bg-rose-900/20 rounded-full text-rose-500">
                <AlertTriangle size={32} />
              </div>
              <div>
                <p className="font-bold text-slate-800 dark:text-white mb-1">Bir Sorun Oluştu</p>
                <p className="text-sm text-slate-500 max-w-md mx-auto">{error}</p>
              </div>
              <button 
                onClick={() => { setFile(null); setError(''); }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-300 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          ) : (
            // Durum 4: Sonuç Listesi
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" />
                  {questions.length} Soru Bulundu
                </h3>
                <span className="text-xs text-slate-500">{selected.length} seçili</span>
              </div>
              
              <div className="grid gap-3">
                {questions.map((q, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleToggle(i)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative group ${
                      selected.includes(i) 
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' 
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        selected.includes(i) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 text-transparent'
                      }`}>
                        <CheckCircle size={14} fill="currentColor" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{q.text}</p>
                        
                        <div className="flex gap-2 flex-wrap">
                           {q.options && q.options.map((opt, oi) => (
                             <span key={oi} className={`text-xs px-2 py-1 rounded border ${
                               q.correctAnswer && (opt.startsWith(q.correctAnswer) || opt === q.correctAnswer)
                                ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                                : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-700 dark:border-slate-600'
                             }`}>
                               {opt}
                             </span>
                           ))}
                        </div>

                        <div className="flex gap-2 mt-2">
                           <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{q.difficulty || 'Orta'}</span>
                           <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{q.subject || 'Genel'}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleToggle(i); }} // Sadece silme değil, seçimden kaldırma
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
          {!file || (file && questions.length === 0 && !loading) ? (
             file && (
               <button 
                 onClick={handleUpload} 
                 className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center gap-2"
               >
                 <Upload size={18} /> Analizi Başlat
               </button>
             )
          ) : questions.length > 0 ? (
             <>
               <button onClick={() => { setFile(null); setQuestions([]); }} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                 Vazgeç
               </button>
               <button 
                 onClick={handleSave} 
                 disabled={selected.length === 0}
                 className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center gap-2"
               >
                 <CheckCircle size={18} /> {selected.length} Soruyu Ekle
               </button>
             </>
          ) : null}
        </div>

      </div>
    </div>
  );
}