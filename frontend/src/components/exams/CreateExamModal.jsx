import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { Clock, Layers, Loader2, FileText } from 'lucide-react';
import apiClient from '../../services/api';
import { SUBJECTS } from '../../data/classLevelsAndDifficulties';
import Button from '../ui/Button.jsx';
import PreviewDialog from '../ui/PreviewDialog.jsx';
const CLASS_LEVELS = Array.from({ length: 12 }, (_, i) => `${i + 1}. Sınıf`);

const CreateExamModal = ({ onClose, onSuccess, initialClassLevel = '9. Sınıf', initialSubject = '' }) => {
  const [creatingExam, setCreatingExam] = useState(false);
  const [formData, setFormData] = useState({ title: '', subject: initialSubject, duration: 25, classLevel: initialClassLevel });
  const [pool, setPool] = useState(null);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolError, setPoolError] = useState('');
  const { showToast } = useToast();
  const titleInputRef = useRef(null);

  useEffect(() => { titleInputRef.current?.focus(); }, []);

  useEffect(() => {
    let active = true;
    setPool(null); setPoolError('');
    if (!formData.subject) { setPoolLoading(false); return; }
    setPoolLoading(true);
    apiClient.get('/exams/pool-summary', {params:{subject:formData.subject,classLevel:formData.classLevel}})
      .then(res => { if (active) setPool(res.data); })
      .catch(() => { if (active) setPoolError('Soru havuzu kontrol edilemedi. Ders veya sınıfı yeniden seçin.'); })
      .finally(() => { if (active) setPoolLoading(false); });
    return () => { active = false; };
  }, [formData.subject, formData.classLevel]);

  const handleCreateExam = async () => {
    if (creatingExam || poolLoading || !pool?.sufficient) return;
    if (!formData.title.trim() || !formData.subject) return showToast('Başlık ve Ders alanları zorunludur.', 'error');
    if (!(Number(formData.duration) > 0)) return showToast('Sınav süresi pozitif olmalıdır.', 'error');
    setCreatingExam(true);
    try {
      await apiClient.post('/exams/auto-generate', formData);
      showToast(`"${formData.title}" başarıyla oluşturuldu!`, 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Havuzda yeterli soru bulunamadı (7-7-7 kuralı)', 'error');
    } finally {
      setCreatingExam(false);
    }
  };

  return (
    <PreviewDialog title="Akıllı Sınav" onClose={() => { if (!creatingExam) onClose(); }}>
      <div className="mx-auto w-full max-w-md">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-surface-400 ml-2">Sınav Başlığı</label>
            <input
              ref={titleInputRef}
              type="text"
              className="w-full p-4 bg-surface-50 dark:bg-surface-900 rounded-2xl border-none font-bold text-surface-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              placeholder="Örn: 2. Sınıf Örüntüler Genel Test"
              aria-label="Sınav başlığı" disabled={creatingExam} value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-surface-400 ml-2 flex items-center gap-1">
                <Clock size={12} /> Süre
              </label>
              <input
                type="number"
                min="1"
                className="w-full p-4 bg-surface-50 dark:bg-surface-900 rounded-2xl font-bold border-none"
                aria-label="Süre" disabled={creatingExam} value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-surface-400 ml-2 flex items-center gap-1">
                <Layers size={12} /> Sınıf
              </label>
              <select
                className="w-full p-4 bg-surface-50 dark:bg-surface-900 rounded-2xl font-bold border-none outline-none"
                aria-label="Sınıf" disabled={creatingExam} value={formData.classLevel}
                onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
              >
                {CLASS_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-surface-400 ml-2">Ders</label>
            <select
              className="w-full p-4 bg-surface-50 dark:bg-surface-900 rounded-2xl font-bold border-none outline-none"
              aria-label="Ders" disabled={creatingExam} value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            >
              <option value="">Seçiniz...</option>
              {SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className="bg-teal-50 dark:bg-teal-900/20 p-5 rounded-3xl border border-teal-100 dark:border-teal-800/40 flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-surface-800 flex items-center justify-center shadow-sm">
              <FileText size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="text-xs font-black text-teal-800 dark:text-teal-300 uppercase tracking-widest">Sınav Analizi</p>
              <p className="text-xs font-bold text-surface-500 mt-0.5">
                Havuzdan 7-7-7 dengesinde toplam 21 soru çekilecektir.
              </p>
            </div>
          </div>

          <div aria-live="polite" className="text-sm">
            {poolLoading ? 'Uygun sorular kontrol ediliyor…' : null}
            {poolError && <p role="alert" className="text-rose-700">{poolError}</p>}
            {pool && <>
              <p>Uygun sorular: Kolay {pool.counts.Kolay}/7 · Orta {pool.counts.Orta}/7 · Zor {pool.counts.Zor}/7</p>
              {!pool.sufficient && <p className="mt-2 text-amber-700">Her seviyede en az 7 uygun soru olmalı. Eksik seviyelere soru ekleyin.</p>}
              {pool.excluded > 0 && <p className="mt-1 text-slate-500">{pool.excluded} tekrar, eksik veya inceleme bekleyen soru dışarıda bırakıldı.</p>}
            </>}
          </div>
          <Button
            variant="success"
            size="lg"
            fullWidth
            onClick={handleCreateExam}
            disabled={creatingExam || poolLoading || !pool?.sufficient}
            className="py-4 text-lg rounded-2xl"
          >
            {creatingExam ? <Loader2 className="animate-spin" /> : 'Oluştur ve Yayınla'}
          </Button>
        </div>
      </div>
    </PreviewDialog>
  );
};

export default CreateExamModal;
