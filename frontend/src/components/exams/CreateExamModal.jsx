import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { X, Sparkles, Clock, Layers, Loader2 } from 'lucide-react';
import apiClient from '../../services/api';
import { CLASS_LEVELS, SUBJECTS } from '../../data/classLevelsAndDifficulties';

const CreateExamModal = ({ onClose, onSuccess }) => {
  const [creatingExam, setCreatingExam] = useState(false);
  const [formData, setFormData] = useState({ title: '', subject: '', duration: 25, classLevel: '9. Sınıf' });
  const { showToast } = useToast();
  const titleInputRef = useRef(null);

  useEffect(() => { titleInputRef.current?.focus(); }, []);

  const handleCreateExam = async () => {
    if (!formData.title || !formData.subject) return showToast("Başlık ve Konu alanları zorunludur.", "error");
    setCreatingExam(true);
    try {
      await apiClient.post('/exams/auto-generate', formData);
      showToast(`"${formData.title}" başarıyla oluşturuldu!`, "success");
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast("Havuzda yeterli soru bulunamadı (7-7-7 kuralı)", "error");
    } finally {
      setCreatingExam(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col scale-in-center">
        
        {/* HEADER */}
        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center relative">
          <div className="z-10">
            <h3 className="text-2xl font-black flex items-center gap-3">
              <Sparkles className="animate-pulse" /> Akıllı Sınav
            </h3>
            <p className="text-indigo-100 text-sm font-medium mt-1">Dengeli bir sınav saniyeler içinde hazır.</p>
          </div>
          <button onClick={onClose} className="z-10 p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
          <Sparkles className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 rotate-12" />
        </div>

        <div className="p-8 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Sınav Başlığı</label>
            <input 
              ref={titleInputRef}
              type="text" 
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-none font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Örn: 2. Sınıf Örüntüler Genel Test"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1"><Clock size={12}/> Süre</label>
              <input type="number" className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold border-none" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1"><Layers size={12}/> Sınıf</label>
              <select className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold border-none outline-none" value={formData.classLevel} onChange={e => setFormData({...formData, classLevel: e.target.value})}>
                {CLASS_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Konu / Kazanım</label>
            <select className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold border-none outline-none" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
              <option value="">Seçiniz...</option>
              {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-3xl border border-indigo-100 flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
              <FileText size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Sınav Analizi</p>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">Havuzdan 7-7-7 dengesinde toplam 21 soru çekilecektir.</p>
            </div>
          </div>

          <button 
            onClick={handleCreateExam} 
            disabled={creatingExam}
            className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {creatingExam ? <Loader2 className="animate-spin" /> : 'Oluştur ve Yayınla'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateExamModal;