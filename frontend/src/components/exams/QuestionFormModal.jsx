import React, { useRef, useEffect, useState } from 'react';
import { 
  X, Save, Loader2, Image as ImageIcon, 
  PlusCircle, Trash2, CheckCircle, Layers, 
  Target, BookOpen, HelpCircle, Sparkles 
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';

const QuestionFormModal = ({ 
  isOpen, onClose, editingId, manualForm, setManualForm, 
  mainImage, setMainImage, onSave 
}) => {
  const firstInputRef = useRef(null);
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Fallback internal state when parent does not provide controlled props
  const [fallbackForm, setFallbackForm] = useState({
    text: '',
    subject: 'Matematik',
    classLevel: '9. Sınıf',
    difficulty: 'Orta',
    correctAnswer: '',
    solution: '',
    options: ['', '', '', '', '']
  });
  const [fallbackMainImage, setFallbackMainImage] = useState({ file: null, preview: '' });

  const effectiveForm = manualForm ?? fallbackForm;
  const effectiveSetForm = setManualForm ?? setFallbackForm;
  const effectiveMainImage = mainImage ?? fallbackMainImage;
  const effectiveSetMainImage = setMainImage ?? setFallbackMainImage;

  // Veri Senkronizasyonu
  const form = {
    text: effectiveForm?.text || '',
    subject: effectiveForm?.subject || 'Matematik',
    classLevel: effectiveForm?.classLevel || '9. Sınıf',
    difficulty: effectiveForm?.difficulty || 'Orta',
    correctAnswer: effectiveForm?.correctAnswer || '',
    solution: effectiveForm?.solution || '',
    options: effectiveForm?.options || ['', '', '', '', '']
  };

  useEffect(() => {
    if (isOpen && firstInputRef.current) firstInputRef.current.focus();
  }, [isOpen]);

  const setField = (k, v) => effectiveSetForm(prev => ({ ...(prev || {}), [k]: v }));
  
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.text?.trim() && !(effectiveMainImage && effectiveMainImage.file)) return showToast('Soru metni veya bir görsel gereklidir', 'error');
    if (!form.correctAnswer?.trim()) return showToast('Lütfen doğru cevabı işaretleyin', 'error');

    setIsSaving(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'options') {
          form.options.forEach(opt => formData.append('options', opt));
        } else {
          formData.append(key, form[key]);
        }
      });
      if (effectiveMainImage && effectiveMainImage.file) formData.append('image', effectiveMainImage.file);

      const endpoint = editingId ? `/questions/${editingId}` : '/questions';
      const method = editingId ? 'put' : 'post';
      
      await apiClient[method](endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast(editingId ? 'Soru güncellendi!' : 'Soru bankasına eklendi!', 'success');
      onSave();
    } catch (err) {
      showToast(err.response?.data?.message || 'Soru kaydedilemedi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col scale-in-center border border-white/20">
        
        {/* HEADER: Gradient Tasarım */}
        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="z-10">
            <h3 className="text-2xl font-black flex items-center gap-3">
              {editingId ? <Sparkles /> : <PlusCircle />} 
              {editingId ? 'Soruyu Güncelle' : 'Soru Bankasına Ekle'}
            </h3>
            <p className="text-indigo-100 text-sm font-medium mt-1 opacity-80">
              MEB Maarif sistemine uygun, kaliteli içerikler oluşturun.
            </p>
          </div>
          <button onClick={onClose} className="z-10 p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
          <BookOpen className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 rotate-12" />
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* 1. BÖLÜM: SORU GİRİŞİ (TEXT + IMAGE) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-2">
                <HelpCircle size={14} /> Soru Metni (LaTeX Destekli)
              </label>
              <textarea
                ref={firstInputRef}
                rows={6}
                className="w-full p-5 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all text-slate-800 dark:text-white font-medium outline-none resize-none"
                value={form.text}
                onChange={e => setField('text', e.target.value)}
                placeholder="Örn: $x^2 + 5x + 6 = 0$ denkleminin kökleri..."
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-2">
                <ImageIcon size={14} /> Soru Görseli (Opsiyonel)
              </label>
              <div className="relative h-[172px] border-4 border-dashed border-slate-100 dark:border-slate-700 rounded-[1.5rem] hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group flex items-center justify-center overflow-hidden">
                <input 
                  type="file" accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if(file) effectiveSetMainImage({ file, preview: URL.createObjectURL(file) });
                  }} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                {effectiveMainImage && effectiveMainImage.preview ? (
                  <div className="relative w-full h-full">
                    <img src={effectiveMainImage.preview} alt="Preview" className="w-full h-full object-contain p-2" />
                    <button type="button" onClick={(e) => { e.preventDefault(); effectiveSetMainImage({file:null, preview:''}); }} className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg z-30 shadow-lg"><Trash2 size={14}/></button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-full"><PlusCircle size={32}/></div>
                    <span className="text-xs font-bold uppercase tracking-tighter">Görsel Yüklemek İçin Tıklayın</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. BÖLÜM: ŞIKLAR VE DOĞRU CEVAP */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-2">
              <CheckCircle size={14} /> Şıklar ve Doğru Cevabı Belirleyin
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {form.options.map((opt, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${form.correctAnswer === opt && opt !== '' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 dark:border-slate-700'}`}>
                  <button 
                    type="button"
                    onClick={() => setField('correctAnswer', opt)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-all ${form.correctAnswer === opt && opt !== '' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}
                  >
                    {String.fromCharCode(65 + i)}
                  </button>
                  <input 
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-slate-300 dark:text-white" 
                    value={opt}
                    onChange={e => {
                      const newOpts = [...form.options];
                      newOpts[i] = e.target.value;
                      setField('options', newOpts);
                    }}
                    placeholder={`Şık ${i+1}...`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 3. BÖLÜM: SINIFLANDIRMA VE ÇÖZÜM */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
             <div className="lg:col-span-1 space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem]">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Zorluk</label>
                  <select value={form.difficulty} onChange={e => setField('difficulty', e.target.value)} className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border-none text-xs font-bold shadow-sm outline-none">
                    {['Kolay','Orta','Zor'].map(lv => <option key={lv}>{lv}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Sınıf</label>
                  <select value={form.classLevel} onChange={e => setField('classLevel', e.target.value)} className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border-none text-xs font-bold shadow-sm outline-none">
                    {['1. Sınıf','2. Sınıf','3. Sınıf','4. Sınıf','5. Sınıf','6. Sınıf','7. Sınıf','8. Sınıf','9. Sınıf','10. Sınıf','11. Sınıf','12. Sınıf'].map(cl => <option key={cl}>{cl}</option>)}
                  </select>
                </div>
             </div>

             <div className="lg:col-span-3 space-y-3">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-2">
                 <Target size={14} /> Çözüm ve Açıklama (İsteğe bağlı)
               </label>
               <textarea
                 rows={4}
                 className="w-full p-5 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border-none outline-none font-medium italic text-sm text-slate-600 dark:text-slate-300"
                 value={form.solution}
                 onChange={e => setField('solution', e.target.value)}
                 placeholder="Öğrenciler için sorunun nasıl çözüldüğünü buraya ekleyebilirsiniz..."
               />
             </div>
          </div>
        </form>

        {/* FOOTER */}
        <div className="p-8 bg-slate-50 dark:bg-slate-900 flex justify-end gap-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
          <button onClick={onClose} className="px-8 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-all">İptal</button>
          <button 
            onClick={handleFormSubmit}
            disabled={isSaving}
            className="px-10 py-3 rounded-2xl bg-indigo-600 text-white font-black flex items-center gap-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
          >
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} 
            {editingId ? 'Güncelle ve Kaydet' : 'Soru Bankasına Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionFormModal;