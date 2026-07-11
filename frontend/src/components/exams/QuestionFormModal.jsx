import React, { useRef, useEffect, useState } from 'react';
import {
  X, Save, Loader2, Image as ImageIcon,
  PlusCircle, Trash2, CheckCircle, Layers,
  Target, BookOpen, HelpCircle, Sparkles, Wand2, ClipboardPaste, ArrowRight, ChevronDown,
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import QuestionTextWithPattern from '../questions/QuestionTextWithPattern.jsx';
import QuestionSourceBadge from '../questions/QuestionSourceBadge.jsx';
import SolutionDisplay from '../questions/SolutionDisplay.jsx';
import { enrichQuestionForm, optionMatchesCorrect } from '../../utils/patternQuestionSolver';
import { parsePastedQuestionText } from '../../utils/parsePastedQuestionText';

const QuestionFormModal = ({ 
  isOpen, onClose, editingId, manualForm, setManualForm, 
  mainImage, setMainImage, onSave, lockedSubject 
}) => {
  const firstInputRef = useRef(null);
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const [markAsExpert, setMarkAsExpert] = useState(false);

  // Fallback internal state when parent does not provide controlled props
  const [fallbackForm, setFallbackForm] = useState({
    text: '',
    subject: 'Matematik',
    topic: '',
    learningOutcome: '',
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
    subject: lockedSubject ? lockedSubject : (effectiveForm?.subject || 'Matematik'),
    topic: effectiveForm?.topic || '',
    learningOutcome: effectiveForm?.learningOutcome || '',
    classLevel: effectiveForm?.classLevel || '9. Sınıf',
    difficulty: effectiveForm?.difficulty || 'Orta',
    correctAnswer: effectiveForm?.correctAnswer || '',
    solution: effectiveForm?.solution || '',
    options: effectiveForm?.options || ['', '', '', '', ''],
    source: effectiveForm?.source || 'Manuel',
    assessmentMeta: effectiveForm?.assessmentMeta || null,
  };

  useEffect(() => {
    if (isOpen && firstInputRef.current) firstInputRef.current.focus();
    if (!isOpen) {
      setPasteText('');
      setPasteOpen(false);
      setAdvancedOpen(false);
      setMarkAsExpert(false);
    }
  }, [isOpen, editingId]);

  const applyParsedPaste = (rawContent, { showNotice = true } = {}) => {
    const parsed = parsePastedQuestionText(rawContent, form);
    if (!parsed?.text?.trim() && !parsed?.options?.some((o) => String(o || '').trim())) {
      if (showNotice) showToast('Metin ayrıştırılamadı. A) B) C) D) formatında yapıştırın.', 'error');
      return false;
    }

    effectiveSetForm((prev) => ({
      ...(prev || {}),
      text: parsed.text,
      options: parsed.options,
      correctAnswer: parsed.correctAnswer || '',
      solution: parsed.solution || prev?.solution || '',
      topic: parsed.topic || prev?.topic || '',
    }));

    if (showNotice) {
      showToast('Soru metni, şıklar ve çözüm alanları dolduruldu.', 'success');
    }
    setPasteOpen(false);
    return true;
  };

  const handlePasteParse = async (contentOverride) => {
    const content = (contentOverride ?? pasteText).trim();
    if (!content) {
      showToast('Lütfen soruyu yapıştırın', 'error');
      return;
    }
    setPasteLoading(true);
    try {
      applyParsedPaste(content);
    } finally {
      setPasteLoading(false);
    }
  };

  const setField = (k, v) => effectiveSetForm(prev => ({ ...(prev || {}), [k]: v }));
  // Ensure subject stays locked if provided
  useEffect(() => {
    if (lockedSubject) {
      setField('subject', lockedSubject);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedSubject]);

  const applyAutoSolve = (showNotice = false) => {
    const filledOptions = (form.options || []).filter((o) => String(o || '').trim());
    if (!form.text?.trim() || filledOptions.length < 2) return false;

    const enriched = enrichQuestionForm(form);
    const changed = enriched.correctAnswer !== form.correctAnswer
      || enriched.solution !== form.solution;
    if (!changed) return false;

    effectiveSetForm((prev) => ({
      ...(prev || {}),
      correctAnswer: enriched.correctAnswer,
      solution: enriched.solution,
    }));
    if (showNotice) {
      showToast('Doğru şık işaretlendi ve çözüm adımları eklendi.', 'success');
    }
    return true;
  };

  useEffect(() => {
    if (!isOpen) return;
    const hasAnswer = String(form.correctAnswer || '').trim().length > 0;
    const hasSolution = String(form.solution || '').trim().length > 0;
    if (hasAnswer && hasSolution) return;

    const timer = setTimeout(() => {
      applyAutoSolve(false);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, form.text, form.options, form.correctAnswer, form.solution]);
  
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.text?.trim() && !(effectiveMainImage && effectiveMainImage.file)) return showToast('Soru metni veya bir görsel gereklidir', 'error');

    const filledOptions = (form.options || []).filter((o) => String(o || '').trim());
    if (filledOptions.length < 2) {
      return showToast('Resimli ve metinli sorular çoktan seçmeli olmalı: en az 2 şık girin', 'error');
    }

    let submitForm = form;
    if (!form.correctAnswer?.trim()) {
      submitForm = enrichQuestionForm(form);
      if (submitForm.correctAnswer !== form.correctAnswer || submitForm.solution !== form.solution) {
        effectiveSetForm((prev) => ({ ...(prev || {}), ...submitForm }));
      }
    }
    if (!submitForm.correctAnswer?.trim()) return showToast('Lütfen doğru cevabı işaretleyin', 'error');

    setIsSaving(true);
    try {
      const resolvedSource =
        markAsExpert || (form.source !== 'AI' && !editingId) ? 'Manuel' : form.source || 'Manuel';
      const formData = new FormData();
      Object.keys(submitForm).forEach(key => {
        if (key === 'options') {
          submitForm.options.forEach(opt => formData.append('options', opt));
        } else if (key !== 'source' && key !== 'assessmentMeta' && key !== 'optionImagePreviews') {
          formData.append(key, submitForm[key]);
        }
      });
      formData.append('source', resolvedSource);
      if (form.assessmentMeta) {
        formData.append('assessmentMeta', JSON.stringify(form.assessmentMeta));
      }
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-surface-800 w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-soft overflow-hidden flex flex-col animate-scale-in border border-white/20">
        
        {/* HEADER */}
        <div className="p-8 bg-gradient-to-r from-teal-700 to-sky-700 text-white flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="z-10">
            <h3 className="font-display text-2xl font-semibold flex items-center gap-3">
              {editingId ? <Sparkles /> : <PlusCircle />} 
              {editingId ? 'Soruyu Güncelle' : 'Soru Bankasına Ekle'}
            </h3>
            <p className="text-teal-100 text-sm font-medium mt-1 opacity-90">
              MEB Maarif sistemine uygun, kaliteli içerikler oluşturun.
            </p>
          </div>
          <button type="button" onClick={onClose} className="z-10 p-2 hover:bg-white/20 rounded-full transition-colors" aria-label="Kapat"><X size={24}/></button>
          <BookOpen className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 rotate-12" />
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

          <div className="flex flex-wrap items-center justify-between gap-3">
            <QuestionSourceBadge
              question={{ source: markAsExpert ? 'Manuel' : form.source, assessmentMeta: form.assessmentMeta }}
              size="lg"
            />
            {form.source === 'AI' && !markAsExpert ? (
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={markAsExpert}
                  onChange={(e) => setMarkAsExpert(e.target.checked)}
                  className="rounded border-teal-400 text-teal-600 focus:ring-teal-500"
                />
                Uzman olarak doğruladım (AI etiketini kaldır)
              </label>
            ) : null}
          </div>

          {form.source === 'AI' && !markAsExpert ? (
            <div
              className="rounded-xl border border-sky-200 bg-sky-50/80 dark:bg-sky-950/30 dark:border-sky-800 px-4 py-3 text-sm text-sky-950 dark:text-sky-100"
              role="status"
            >
              <strong className="font-black">AI kaynağı:</strong> Metin, şıklar ve doğru cevabı kaydetmeden önce
              kontrol edin. Onayladığınızda «Uzman olarak doğruladım» seçeneğini işaretleyebilirsiniz.
            </div>
          ) : null}

          {/* Gelişmiş: kopyala-yapıştır */}
          {!editingId ? (
            <section className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                aria-expanded={advancedOpen}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Gelişmiş
                </span>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
              {advancedOpen ? (
                <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300 flex items-center gap-2">
                      <ClipboardPaste size={14} /> Kopyala-yapıştır
                    </label>
                    <button
                      type="button"
                      onClick={() => setPasteOpen((v) => !v)}
                      className="text-[10px] font-bold uppercase text-teal-600"
                    >
                      {pasteOpen ? 'Gizle' : 'Aç'}
                    </button>
                  </div>
                  {pasteOpen ? (
                    <>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        PDF, Word veya ekrandan soruyu kopyalayıp yapıştırın. Sistem metni, şıkları (A) B) C) D)) ve varsa
                        cevabı ayırır.
                      </p>
                      <textarea
                        rows={5}
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData('text');
                          if (!pasted?.trim()) return;
                          setTimeout(() => {
                            setPasteText(pasted);
                            applyParsedPaste(pasted);
                          }, 0);
                        }}
                        className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-teal-400 text-sm font-medium"
                        placeholder={'Örn:\nKenar uzunlukları 2 cm olan...\nA) 11  B) 17  C) 22  D) 28\nCevap: D'}
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={pasteLoading}
                          onClick={() => handlePasteParse()}
                          className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                        >
                          {pasteLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                          Ayrıştır ve forma aktar
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Toplu metin yapıştırarak soru alanlarını otomatik doldurabilirsiniz.
                    </p>
                  )}
                </div>
              ) : null}
            </section>
          ) : null}
          
          {/* 1. BÖLÜM: SORU GİRİŞİ (TEXT + IMAGE) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-2">
                <HelpCircle size={14} /> Soru Metni (LaTeX Destekli)
              </label>
              <textarea
                ref={firstInputRef}
                rows={6}
                className="w-full p-5 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] border-2 border-transparent focus:border-teal-500 focus:bg-white transition-all text-slate-800 dark:text-white font-medium outline-none resize-none"
                value={form.text}
                onChange={e => setField('text', e.target.value)}
                placeholder="Örn: $x^2 + 5x + 6 = 0$ denkleminin kökleri..."
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-2">
                <ImageIcon size={14} /> Soru Görseli (Opsiyonel)
              </label>
              <p className="text-xs text-slate-500 ml-2 -mt-1">
                Görsel yalnızca soru köküne eklenir. Şıklar metin olarak girilir.
              </p>
              <div className="relative h-[172px] border-4 border-dashed border-slate-100 dark:border-slate-700 rounded-[1.5rem] hover:border-teal-300 hover:bg-teal-50/30 transition-all group flex items-center justify-center overflow-hidden">
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
                  <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-teal-500 transition-colors">
                    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-full"><PlusCircle size={32}/></div>
                    <span className="text-xs font-bold uppercase tracking-tighter">Görsel Yüklemek İçin Tıklayın</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {form.text.trim() ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-900/40 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                Soru bankası / sınavda öğrencinin göreceği düzen
              </p>
              <QuestionTextWithPattern
                text={form.text}
                mainClassName="text-base text-slate-800 dark:text-slate-200"
              />
            </div>
          ) : null}

          {/* 2. BÖLÜM: ŞIKLAR VE DOĞRU CEVAP */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 ml-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <CheckCircle size={14} /> Şıklar ve Doğru Cevabı Belirleyin
              </h4>
              <button
                type="button"
                onClick={() => applyAutoSolve(true)}
                className="text-[10px] font-black uppercase tracking-wider text-teal-600 hover:text-teal-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-900/30"
              >
                <Wand2 size={12} /> Çöz ve işaretle
              </button>
            </div>
            {form.correctAnswer?.trim() ? (
              <p className="text-xs font-bold text-emerald-600 ml-2">
                Doğru şık işaretlendi: {form.options.findIndex((o) => optionMatchesCorrect(o, form.correctAnswer)) >= 0
                  ? `${String.fromCharCode(65 + form.options.findIndex((o) => optionMatchesCorrect(o, form.correctAnswer)))}) ${form.correctAnswer}`
                  : form.correctAnswer}
              </p>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {form.options.map((opt, i) => {
                const isCorrect = optionMatchesCorrect(opt, form.correctAnswer);
                return (
                <div key={i} className={`flex flex-col gap-2 p-3 rounded-2xl border-2 transition-all ${isCorrect ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 dark:border-slate-700'}`}>
                  <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setField('correctAnswer', opt)}
                    title="Doğru cevap olarak işaretle"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-all ${isCorrect ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}
                  >
                    {isCorrect ? <CheckCircle size={14} /> : String.fromCharCode(65 + i)}
                  </button>
                  <input 
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-slate-300 dark:text-white" 
                    value={opt}
                    onChange={e => {
                      const newOpts = [...form.options];
                      const prevVal = newOpts[i];
                      newOpts[i] = e.target.value;
                      const updates = { options: newOpts };
                      if (optionMatchesCorrect(prevVal, form.correctAnswer)) {
                        updates.correctAnswer = e.target.value;
                      }
                      effectiveSetForm((prev) => ({ ...(prev || {}), ...updates }));
                    }}
                    placeholder={`Şık ${i+1}...`}
                  />
                  </div>
                </div>
              );})}
            </div>
          </div>

          {/* 3. BÖLÜM: SINIFLANDIRMA VE ÇÖZÜM */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
             <div className="lg:col-span-1 space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem]">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Konu</label>
                  <input
                    type="text"
                    value={form.topic}
                    onChange={(e) => setField('topic', e.target.value)}
                    placeholder="Örn: Örüntüler — Geometrik (şekil)"
                    className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border-none text-xs font-bold shadow-sm outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Kazanım (isteğe bağlı)</label>
                  <textarea
                    rows={2}
                    value={form.learningOutcome}
                    onChange={(e) => setField('learningOutcome', e.target.value)}
                    placeholder="MEB kazanım ifadesi veya kısa hedef..."
                    className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border-none text-xs font-medium shadow-sm outline-none resize-none"
                  />
                </div>
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
                 <Target size={14} /> Çözüm adımları (isteğe bağlı)
               </label>
               <textarea
                 rows={5}
                 className="w-full p-5 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border-none outline-none font-medium text-sm text-slate-600 dark:text-slate-300"
                 value={form.solution}
                 onChange={e => setField('solution', e.target.value)}
                 placeholder="Her satıra bir adım yazın. Örn:&#10;1. Örüntüde 5. adımda 5 üçgen vardır.&#10;2. Çevre = 12 + 4×(5−1) = 28 cm.&#10;3. Doğru cevap D) 28."
               />
               {form.solution?.trim() ? (
                 <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-900/40 p-4">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Önizleme</p>
                   <SolutionDisplay text={form.solution} />
                 </div>
               ) : null}
             </div>
          </div>
        </form>

        {/* FOOTER */}
        <div className="p-8 bg-slate-50 dark:bg-slate-900 flex justify-end gap-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
          <button onClick={onClose} className="px-8 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-all">İptal</button>
          <button 
            onClick={handleFormSubmit}
            disabled={isSaving}
            className="px-10 py-3 rounded-2xl bg-teal-600 text-white font-black flex items-center gap-2 shadow-xl shadow-teal-100 hover:bg-teal-700 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
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