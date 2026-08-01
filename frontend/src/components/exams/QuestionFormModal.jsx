import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Save, Loader2, Image as ImageIcon,
  PlusCircle, Trash2, BookOpen, HelpCircle, Sparkles,
  FileText, Images, ListOrdered,
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import QuestionSourceBadge from '../questions/QuestionSourceBadge.jsx';
import QuestionStemCard from '../questions/QuestionStemCard.jsx';
import SolutionDisplay from '../questions/SolutionDisplay.jsx';
import { enrichQuestionForm, optionMatchesCorrect } from '../../utils/patternQuestionSolver';
import {
  buildCombinedQuestionText,
  getQuestionLayout,
  PATTERN_INTRO_PLACEHOLDER,
  PATTERN_QUESTION_PLACEHOLDER,
} from '../../utils/questionLayout.js';
import { normalizeSolutionText } from '../../utils/latex.jsx';

const LETTERS = ['A', 'B', 'C', 'D'];
const CLASS_LEVELS = Array.from({ length: 12 }, (_, i) => `${i + 1}. Sınıf`);

const emptyDraft = (index = 0) => ({
  questionText: '',
  correctLetter: '',
  options: ['', '', '', ''],
  difficulty: 'Orta',
  learningOutcome: '',
  solution: '',
  label: `${index + 1}. Soru`,
});

const letterFromAnswer = (options = [], correctAnswer = '') => {
  const ca = String(correctAnswer || '').trim();
  if (!ca) return '';
  if (/^[A-D]$/i.test(ca)) return ca.toUpperCase();
  const idx = options.findIndex((o) => optionMatchesCorrect(o, ca));
  return idx >= 0 && idx < 4 ? LETTERS[idx] : '';
};

const answerFromLetter = (letter, options = [], imageMode = false) => {
  const idx = LETTERS.indexOf(String(letter || '').toUpperCase());
  if (idx < 0) return '';
  const opt = String(options[idx] || '').trim();
  if (imageMode) return LETTERS[idx];
  return opt || LETTERS[idx];
};

const WIZARD_STEP_NUMBERS = { format: 1, count: 2, form: 3 };
const WIZARD_STEP_COUNT = 3;

const QuestionFormModal = ({
  isOpen,
  onClose,
  editingId,
  manualForm,
  setManualForm,
  mainImage,
  setMainImage,
  onSave,
  lockedSubject,
}) => {
  const firstInputRef = useRef(null);
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [markAsExpert, setMarkAsExpert] = useState(false);

  const [wizardStep, setWizardStep] = useState('format'); // format | count | form
  const [contentMode, setContentMode] = useState('image'); // image | text
  const [questionCount, setQuestionCount] = useState(1);
  const [sharedIntro, setSharedIntro] = useState('');
  const [sharedTopic, setSharedTopic] = useState('');
  const [sharedClassLevel, setSharedClassLevel] = useState('5. Sınıf');
  const [drafts, setDrafts] = useState([emptyDraft(0)]);

  const [fallbackForm, setFallbackForm] = useState({
    text: '',
    subject: 'Matematik',
    topic: '',
    learningOutcome: '',
    classLevel: '9. Sınıf',
    difficulty: 'Orta',
    correctAnswer: '',
    solution: '',
    options: ['', '', '', ''],
  });
  const [fallbackMainImage, setFallbackMainImage] = useState({ file: null, preview: '' });

  const effectiveForm = manualForm ?? fallbackForm;
  const effectiveSetForm = setManualForm ?? setFallbackForm;
  const effectiveMainImage = mainImage ?? fallbackMainImage;
  const effectiveSetMainImage = setMainImage ?? setFallbackMainImage;

  const layoutFromForm = getQuestionLayout({
    text: effectiveForm?.text,
    introText: effectiveForm?.introText,
    questionText: effectiveForm?.questionText,
    assessmentMeta: effectiveForm?.assessmentMeta,
  });

  const form = useMemo(() => ({
    text: effectiveForm?.text || '',
    introText: effectiveForm?.introText ?? layoutFromForm.introText,
    questionText: effectiveForm?.questionText ?? layoutFromForm.questionText,
    subject: lockedSubject || effectiveForm?.subject || 'Matematik',
    topic: effectiveForm?.topic || '',
    learningOutcome: effectiveForm?.learningOutcome || '',
    classLevel: effectiveForm?.classLevel || '9. Sınıf',
    difficulty: effectiveForm?.difficulty || 'Orta',
    correctAnswer: effectiveForm?.correctAnswer || '',
    solution: effectiveForm?.solution || '',
    options: (effectiveForm?.options || ['', '', '', '']).slice(0, 4),
    source: effectiveForm?.source || 'Manuel',
    assessmentMeta: effectiveForm?.assessmentMeta || null,
  }), [effectiveForm, layoutFromForm.introText, layoutFromForm.questionText, lockedSubject]);

  const isImageMode = contentMode === 'image';
  const isMulti = !editingId && questionCount > 1 && wizardStep === 'form';

  const applyContentMode = (mode) => {
    setContentMode(mode);
    if (mode === 'text') {
      effectiveSetMainImage({ file: null, preview: '' });
    }
    if (mode === 'image') {
      setDrafts((prev) => prev.map((row) => ({
        ...row,
        options: ['', '', '', ''],
      })));
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    // AI aktarımı gibi önceden doldurulmuş formlar da doğrudan form adımına gitsin
    const prefilled = Boolean(
      String(manualForm?.text || '').trim()
      || String(manualForm?.questionText || '').trim()
      || String(manualForm?.correctAnswer || '').trim()
      || (manualForm?.options || []).some((o) => String(typeof o === 'object' ? o?.text : o || '').trim())
    );
    if (editingId || prefilled) {
      const savedMode = manualForm?.assessmentMeta?.contentMode;
      const resolvedMode = savedMode === 'text' || savedMode === 'image'
        ? savedMode
        : (mainImage?.preview ? 'image' : 'text');
      setWizardStep('form');
      setContentMode(resolvedMode);
      setQuestionCount(1);
      setSharedIntro(manualForm?.introText || layoutFromForm.introText || '');
      setSharedTopic(manualForm?.topic || '');
      setSharedClassLevel(manualForm?.classLevel || '9. Sınıf');
      setDrafts([{
        questionText: manualForm?.questionText || layoutFromForm.questionText || '',
        correctLetter: letterFromAnswer(manualForm?.options || [], manualForm?.correctAnswer || ''),
        options: (manualForm?.options || ['', '', '', '']).slice(0, 4),
        difficulty: manualForm?.difficulty || 'Orta',
        learningOutcome: manualForm?.learningOutcome || '',
        solution: manualForm?.solution || '',
        label: '1. Soru',
      }]);
    } else {
      // Yeni soru: önce resimli / metinli işaretlensin
      setWizardStep('format');
      setContentMode('image');
      setQuestionCount(1);
      setSharedIntro(manualForm?.introText || '');
      setSharedTopic(manualForm?.topic || '');
      setSharedClassLevel(manualForm?.classLevel || '5. Sınıf');
      setDrafts([emptyDraft(0)]);
      setMarkAsExpert(false);
      effectiveSetMainImage({ file: null, preview: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingId]);

  useEffect(() => {
    if (isOpen && wizardStep === 'form' && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen, wizardStep]);

  const setField = (k, v) => effectiveSetForm((prev) => ({ ...(prev || {}), [k]: v }));

  const updateDraft = (index, patch) => {
    setDrafts((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const buildSlots = (count) => {
    const next = Array.from({ length: count }, (_, i) => emptyDraft(i));
    setDrafts(next);
    setQuestionCount(count);
    setWizardStep('form');
    showToast(
      count > 1
        ? `${count} soruluk form hazır. Her madde için metin ve A–D cevap girin.`
        : 'Soru formu hazır.',
      'success',
    );
  };

  const postOneQuestion = async ({
    introText,
    questionText,
    options,
    correctAnswer,
    solution,
    learningOutcome,
    difficulty,
    topic,
    classLevel,
    assessmentMeta,
    attachImage,
  }) => {
    const text = buildCombinedQuestionText(introText, questionText);
    let payload = enrichQuestionForm({
      text,
      introText,
      questionText,
      options,
      correctAnswer,
      solution: normalizeSolutionText(solution || ''),
      learningOutcome,
      difficulty,
      topic,
      classLevel,
      subject: lockedSubject || 'Matematik',
      source: 'Manuel',
      type: 'multiple-choice',
    });

    const formData = new FormData();
    const skip = new Set(['options', 'assessmentMeta', 'introText', 'questionText', 'optionImagePreviews']);
    (payload.options || []).slice(0, 4).forEach((opt) => formData.append('options', opt));
    Object.keys(payload).forEach((key) => {
      if (skip.has(key) || payload[key] == null) return;
      formData.append(key, payload[key]);
    });
    formData.append('source', markAsExpert || payload.source !== 'AI' ? 'Manuel' : payload.source);
    formData.append('assessmentMeta', JSON.stringify({
      ...(assessmentMeta || {}),
      parseLayout: {
        introText: introText || '',
        questionLine: questionText || '',
        stemText: text,
      },
      contentMode,
    }));
    if (attachImage && effectiveMainImage?.file) {
      formData.append('image', effectiveMainImage.file);
    }
    if (editingId && contentMode === 'text') {
      // Metin moduna geçildi: sunucudaki eski görseli kaldır
      formData.append('removeImage', 'true');
    }

    const endpoint = editingId ? `/questions/${editingId}` : '/questions';
    const method = editingId ? 'put' : 'post';
    const res = await apiClient[method](endpoint, formData);
    return res?.data?.data || null;
  };

  const handleFormSubmit = async (e) => {
    e?.preventDefault?.();
    if (wizardStep !== 'form') return;

    if (isImageMode && !(effectiveMainImage?.file || effectiveMainImage?.preview)) {
      return showToast('Resimli soru için görsel yükleyin.', 'error');
    }

    if (!isMulti) {
      const d = drafts[0] || emptyDraft(0);
      const intro = String(sharedIntro || form.introText || '').trim();
      const question = String(d.questionText || form.questionText || '').trim();
      if (!isImageMode && !intro && !question) {
        return showToast('Metin sorusu için soru metni girin.', 'error');
      }
      if (!d.correctLetter && !form.correctAnswer) {
        return showToast('Doğru cevabı (A–D) seçin.', 'error');
      }
      const previewOptions = isImageMode
        ? [...LETTERS]
        : (d.options?.length ? d.options : form.options).map((o, idx) => String(o || '').trim() || LETTERS[idx]).slice(0, 4);
      if (!isImageMode && previewOptions.filter((o) => o && !/^[A-D]$/i.test(o)).length < 2) {
        return showToast('En az 2 şık metni girin.', 'error');
      }
    }

    setIsSaving(true);
    try {
      if (isMulti) {
        const groupId = `manual-multi-${Date.now().toString(36)}`;
        const stem = String(sharedIntro || '').trim();
        let sharedImageUrl = '';
        for (let i = 0; i < drafts.length; i += 1) {
          const d = drafts[i];
          const qLine = String(d.questionText || '').trim();
          if (!isImageMode && !qLine) {
            showToast(`${i + 1}. soru metni boş.`, 'error');
            setIsSaving(false);
            return;
          }
          if (!d.correctLetter) {
            showToast(`${i + 1}. soru için doğru cevabı (A–D) seçin.`, 'error');
            setIsSaving(false);
            return;
          }
          const options = isImageMode
            ? [...LETTERS]
            : (d.options || []).map((o, idx) => String(o || '').trim() || LETTERS[idx]).slice(0, 4);
          if (!isImageMode && options.filter((o) => o && !/^[A-D]$/i.test(o)).length < 2) {
            showToast(`${i + 1}. soruda en az 2 şık metni girin.`, 'error');
            setIsSaving(false);
            return;
          }
          const saved = await postOneQuestion({
            introText: stem,
            questionText: qLine || (isImageMode ? 'Aşağıdaki soruyu çözünüz.' : ''),
            options,
            correctAnswer: answerFromLetter(d.correctLetter, options, isImageMode),
            solution: d.solution || '',
            learningOutcome: d.learningOutcome || '',
            difficulty: d.difficulty || 'Orta',
            topic: sharedTopic || '',
            classLevel: sharedClassLevel || '5. Sınıf',
            assessmentMeta: {
              groupId,
              groupIndex: i + 1,
              groupSize: drafts.length,
              sharedStem: stem,
              sharedImage: sharedImageUrl || undefined,
              sharedPrompt: 'Aşağıdaki soruları yukarıdaki bilgilere göre cevaplayınız.',
              source: 'manual-multi',
              contentMode,
            },
            attachImage: isImageMode && i === 0,
          });
          if (i === 0 && isImageMode) {
            sharedImageUrl = String(saved?.image || '').trim();
          }
        }
        showToast(`${drafts.length} soru bankaya eklendi.`, 'success');
        onSave();
        return;
      }

      // Single (new or edit)
      const d = drafts[0] || emptyDraft(0);
      const intro = String(sharedIntro || form.introText || '').trim();
      const question = String(d.questionText || form.questionText || '').trim();
      const options = isImageMode
        ? [...LETTERS]
        : (d.options?.length ? d.options : form.options).map((o, idx) => String(o || '').trim() || LETTERS[idx]).slice(0, 4);
      const letter = d.correctLetter || letterFromAnswer(options, form.correctAnswer);
      await postOneQuestion({
        introText: intro,
        questionText: question || (isImageMode ? 'Aşağıdaki soruyu çözünüz.' : ''),
        options,
        correctAnswer: answerFromLetter(letter, options, isImageMode),
        solution: d.solution || form.solution || '',
        learningOutcome: d.learningOutcome || form.learningOutcome || '',
        difficulty: d.difficulty || form.difficulty || 'Orta',
        topic: sharedTopic || form.topic || '',
        classLevel: sharedClassLevel || form.classLevel || '9. Sınıf',
        assessmentMeta: {
          ...(form.assessmentMeta || {}),
          contentMode,
        },
        attachImage: isImageMode,
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

  const renderLetterPicker = (draft, index) => (
    <div>
      <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
        {isMulti ? `${index + 1}. sorunun doğru cevabı (A–D)` : 'Doğru cevap (A–D)'}
      </label>
      <div className="flex flex-wrap gap-2" role="group" aria-label={`${index + 1}. soru A–D şıkları`}>
        {LETTERS.map((letter) => {
          const selected = draft.correctLetter === letter;
          return (
            <button
              key={letter}
              type="button"
              onClick={() => updateDraft(index, { correctLetter: letter })}
              className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-lg font-black transition-all ${
                selected
                  ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-300/40 dark:bg-teal-950/40 dark:text-teal-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-slate-600 dark:bg-slate-900'
              }`}
              aria-pressed={selected}
            >
              {letter}
            </button>
          );
        })}
      </div>
      {isMulti ? (
        <p className="mt-2 text-[11px] text-slate-500">
          Bu maddenin A–D şıkları yalnızca bu soruya aittir; diğer maddelerden ayrıdır.
        </p>
      ) : null}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-surface-800 w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-soft overflow-hidden flex flex-col animate-scale-in border border-white/20">
        <div className="p-8 bg-gradient-to-r from-teal-700 to-sky-700 text-white flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="z-10">
            <h3 className="font-display text-2xl font-semibold flex items-center gap-3">
              {editingId ? <Sparkles /> : <PlusCircle />}
              {editingId ? 'Soruyu Güncelle' : 'Soru Bankasına Ekle'}
            </h3>
            <p className="text-teal-100 text-sm font-medium mt-1 opacity-90">
              {wizardStep === 'format' && 'Soru resimli mi, metin mi? İşaretleyin'}
              {wizardStep === 'count' && 'Tek soru mu, birden fazla mı?'}
              {wizardStep === 'form' && (isImageMode
                ? 'Resimli soru — görsel yükleyin, doğru cevabı A–D işaretleyin'
                : 'Metin sorusu — soru ve şık metinlerini girin')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="z-10 p-2 hover:bg-white/20 rounded-full transition-colors" aria-label="Kapat">
            <X size={24} />
          </button>
          <BookOpen className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 rotate-12" />
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {!editingId && wizardStep === 'format' ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Önce sorunun türünü işaretleyin. Buna göre ya görsel ya da metin girişi açılır.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => { applyContentMode('image'); setWizardStep('count'); }}
                  className="flex min-h-[13rem] flex-col justify-between rounded-[1.5rem] border-2 border-teal-200 bg-teal-50/50 p-7 text-left transition-all hover:border-teal-500 hover:shadow-md dark:bg-teal-950/20"
                >
                  <Images className="text-teal-600" size={36} />
                  <div>
                    <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">Resimli soru</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Soru görseli yüklenir. Şık metni girilmez; yalnızca A–D doğru cevap işaretlenir.
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { applyContentMode('text'); setWizardStep('count'); }}
                  className="flex min-h-[13rem] flex-col justify-between rounded-[1.5rem] border-2 border-sky-200 bg-sky-50/50 p-7 text-left transition-all hover:border-sky-500 hover:shadow-md dark:bg-sky-950/20"
                >
                  <FileText className="text-sky-600" size={36} />
                  <div>
                    <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">Metin soru</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Soru metni ve A–D şık metinleri yazılır. Görsel gerekmez.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : null}

          {!editingId && wizardStep === 'count' ? (
            <div className="space-y-4">
              <button type="button" onClick={() => setWizardStep('format')} className="text-sm font-semibold text-teal-700">
                ← Geri
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => buildSlots(1)}
                  className="flex min-h-[11rem] flex-col justify-between rounded-[1.5rem] border-2 border-slate-200 p-7 text-left hover:border-teal-500 transition-all"
                >
                  <HelpCircle className="text-slate-500" size={32} />
                  <div>
                    <p className="font-semibold text-lg">Tek soru</p>
                    <p className="text-sm text-slate-500 mt-1">Bir soru kaydı oluşturur.</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => buildSlots(3)}
                  className="flex min-h-[11rem] flex-col justify-between rounded-[1.5rem] border-2 border-slate-200 p-7 text-left hover:border-teal-500 transition-all"
                >
                  <ListOrdered className="text-slate-500" size={32} />
                  <div>
                    <p className="font-semibold text-lg">Birden fazla soru</p>
                    <p className="text-sm text-slate-500 mt-1">Ortak kök + 3 madde (1–2–3. soru) otomatik açılır.</p>
                  </div>
                </button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider self-center">Adet:</span>
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => buildSlots(n)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:border-teal-400"
                  >
                    {n} soru
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {wizardStep === 'form' ? (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {!editingId ? (
                <button type="button" onClick={() => setWizardStep('format')} className="text-sm font-semibold text-teal-700">
                  ← Tür seçimine dön
                </button>
              ) : null}

              <section className="rounded-[1.5rem] border border-slate-200 p-4 dark:border-slate-700">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Soru türü
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Soru türü">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isImageMode}
                    onClick={() => applyContentMode('image')}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                      isImageMode
                        ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-300/30 dark:bg-teal-950/30'
                        : 'border-slate-200 hover:border-teal-300 dark:border-slate-600'
                    }`}
                  >
                    <Images className={isImageMode ? 'text-teal-600' : 'text-slate-400'} size={22} />
                    <span>
                      <span className="block font-bold text-slate-900 dark:text-white">Resimli</span>
                      <span className="mt-0.5 block text-xs text-slate-500">Görsel yüklenir, şıklar A–D</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!isImageMode}
                    onClick={() => applyContentMode('text')}
                    className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                      !isImageMode
                        ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-300/30 dark:bg-sky-950/30'
                        : 'border-slate-200 hover:border-sky-300 dark:border-slate-600'
                    }`}
                  >
                    <FileText className={!isImageMode ? 'text-sky-600' : 'text-slate-400'} size={22} />
                    <span>
                      <span className="block font-bold text-slate-900 dark:text-white">Metin</span>
                      <span className="mt-0.5 block text-xs text-slate-500">Soru ve şık metinleri yazılır</span>
                    </span>
                  </button>
                </div>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <QuestionSourceBadge
                  question={{ source: markAsExpert ? 'Manuel' : form.source, assessmentMeta: form.assessmentMeta }}
                  size="lg"
                />
                {form.source === 'AI' && !markAsExpert ? (
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-teal-800">
                    <input type="checkbox" checked={markAsExpert} onChange={(e) => setMarkAsExpert(e.target.checked)} />
                    Uzman olarak doğruladım
                  </label>
                ) : null}
              </div>

              {isImageMode ? (
                <section className="space-y-3 rounded-[1.5rem] border border-teal-200 bg-teal-50/30 p-5 dark:border-teal-900/40 dark:bg-teal-950/10">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">
                    <ImageIcon size={14} /> Soru görseli (zorunlu)
                  </label>
                  <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-[1.5rem] border-4 border-dashed border-teal-200 transition-all hover:border-teal-400 dark:border-teal-800">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) effectiveSetMainImage({ file, preview: URL.createObjectURL(file) });
                      }}
                      className="absolute inset-0 z-20 cursor-pointer opacity-0"
                    />
                    {effectiveMainImage?.preview ? (
                      <div className="relative h-full w-full">
                        <img src={effectiveMainImage.preview} alt="Önizleme" className="h-full w-full object-contain p-2" />
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); effectiveSetMainImage({ file: null, preview: '' }); }}
                          className="absolute right-2 top-2 z-30 rounded-lg bg-rose-500 p-1.5 text-white"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-teal-700/70 dark:text-teal-300/70">
                        <PlusCircle size={32} />
                        <span className="text-xs font-bold uppercase">Görsel yükle</span>
                      </div>
                    )}
                  </div>
                </section>
              ) : (
                <div className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-sm text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-200">
                  Metin sorusu seçildi. Görsel yüklenmez; soru ve şık metinlerini aşağıya yazın.
                </div>
              )}

              <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {!isImageMode || isMulti ? (
                  <div className="sm:col-span-3">
                    <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {isMulti ? 'Ortak giriş / üst açıklama' : 'Giriş metni (isteğe bağlı)'}
                    </label>
                    <textarea
                      ref={firstInputRef}
                      rows={2}
                      value={sharedIntro}
                      onChange={(e) => {
                        setSharedIntro(e.target.value);
                        setField('introText', e.target.value);
                      }}
                      className="w-full rounded-2xl border-none bg-slate-50 p-3 text-sm outline-none dark:bg-slate-900"
                      placeholder={PATTERN_INTRO_PLACEHOLDER}
                    />
                  </div>
                ) : null}
                <div>
                  <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Konu</label>
                  <input
                    ref={isImageMode && !isMulti ? firstInputRef : undefined}
                    value={sharedTopic}
                    onChange={(e) => { setSharedTopic(e.target.value); setField('topic', e.target.value); }}
                    className="w-full rounded-xl border-none bg-slate-50 p-3 text-sm font-medium outline-none dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Sınıf</label>
                  <select
                    value={sharedClassLevel}
                    onChange={(e) => { setSharedClassLevel(e.target.value); setField('classLevel', e.target.value); }}
                    className="w-full rounded-xl border-none bg-white p-3 text-sm font-bold outline-none dark:bg-slate-800"
                  >
                    {CLASS_LEVELS.map((cl) => <option key={cl}>{cl}</option>)}
                  </select>
                </div>
              </section>

              {drafts.map((draft, index) => (
                <section
                  key={`draft-${index}`}
                  className="space-y-4 rounded-[1.5rem] border-2 border-teal-200/70 bg-white p-5 dark:border-teal-900/40 dark:bg-surface-800"
                >
                  <h4 className="font-display text-lg font-semibold text-teal-800 dark:text-teal-200">
                    {index + 1}. Soru
                  </h4>

                  {!isImageMode ? (
                    <div>
                      <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Soru metni
                      </label>
                      <textarea
                        rows={3}
                        value={draft.questionText}
                        onChange={(e) => updateDraft(index, { questionText: e.target.value })}
                        className="w-full rounded-xl border-none bg-slate-50 p-3 text-sm font-medium outline-none dark:bg-slate-900"
                        placeholder={PATTERN_QUESTION_PLACEHOLDER}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Soru cümlesi (isteğe bağlı)
                      </label>
                      <textarea
                        rows={2}
                        value={draft.questionText}
                        onChange={(e) => updateDraft(index, { questionText: e.target.value })}
                        className="w-full rounded-xl border-none bg-slate-50 p-3 text-sm font-medium outline-none dark:bg-slate-900"
                        placeholder="Boş bırakılabilir — görseldeki soru yeterlidir"
                      />
                    </div>
                  )}

                  {renderLetterPicker(draft, index)}

                  {!isImageMode ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {LETTERS.map((letter, optIdx) => (
                        <div key={letter} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2 dark:border-slate-700">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-black dark:bg-slate-700">
                            {letter}
                          </span>
                          <input
                            value={draft.options[optIdx] || ''}
                            onChange={(e) => {
                              const next = [...(draft.options || ['', '', '', ''])];
                              next[optIdx] = e.target.value;
                              updateDraft(index, { options: next });
                            }}
                            className="flex-1 bg-transparent text-sm font-medium outline-none"
                            placeholder={`${letter} şıkkı metni`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Resimli soruda şık metni girilmez; öğrenciler görseldeki A–D şıklarını kullanır.
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Zorluk seviyesi
                      </label>
                      <select
                        value={draft.difficulty}
                        onChange={(e) => updateDraft(index, { difficulty: e.target.value })}
                        className="w-full rounded-xl border-none bg-slate-50 p-3 text-sm font-bold outline-none dark:bg-slate-900"
                      >
                        {['Kolay', 'Orta', 'Zor'].map((lv) => <option key={lv}>{lv}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Kazanım
                      </label>
                      <input
                        value={draft.learningOutcome}
                        onChange={(e) => updateDraft(index, { learningOutcome: e.target.value })}
                        className="w-full rounded-xl border-none bg-slate-50 p-3 text-sm outline-none dark:bg-slate-900"
                        placeholder="Öğrenme kazanımı"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Çözüm
                    </label>
                    <textarea
                      rows={2}
                      value={draft.solution}
                      onChange={(e) => updateDraft(index, { solution: e.target.value })}
                      onBlur={(e) => {
                        const next = normalizeSolutionText(e.target.value);
                        if (next !== String(draft.solution || '').trim()) {
                          updateDraft(index, { solution: next });
                        }
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData?.getData('text');
                        if (!pasted) return;
                        e.preventDefault();
                        const next = normalizeSolutionText(pasted);
                        updateDraft(index, { solution: next });
                      }}
                      className="w-full rounded-xl border-none bg-slate-50 p-3 text-sm outline-none dark:bg-slate-900"
                      placeholder="Kısa çözüm — yapıştırınca adımlar otomatik ayrılır"
                    />
                    {draft.solution?.trim() ? (
                      <div className="mt-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                        <SolutionDisplay text={draft.solution} />
                      </div>
                    ) : null}
                  </div>
                </section>
              ))}

              {(sharedIntro.trim() || drafts.some((d) => d.questionText?.trim()) || effectiveMainImage?.preview) ? (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-600 dark:bg-slate-900/40">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Önizleme{isMulti ? ` · ${drafts.length} madde` : ' (1. soru)'}
                  </p>
                  {isMulti ? (
                    <div className="space-y-4">
                      {(isImageMode && effectiveMainImage?.preview) || sharedIntro.trim() ? (
                        <QuestionStemCard
                          question={{
                            topic: sharedTopic,
                            classLevel: sharedClassLevel,
                            introText: sharedIntro,
                            questionText: '',
                            text: sharedIntro,
                            image: isImageMode ? (effectiveMainImage?.preview || '') : '',
                            assessmentMeta: {
                              contentMode,
                              parseLayout: { introText: sharedIntro, questionLine: '' },
                            },
                          }}
                          showMeta={Boolean(sharedTopic)}
                          showImageInstruction={false}
                        />
                      ) : null}
                      {drafts.map((draft, index) => (
                        <div
                          key={`preview-${index}`}
                          className="rounded-xl border border-teal-100 bg-white p-4 dark:border-teal-900/40 dark:bg-surface-800"
                        >
                          <p className="mb-2 text-sm font-semibold text-surface-800 dark:text-white">
                            <span className="mr-2 font-black text-teal-700">{index + 1}.</span>
                            {draft.questionText?.trim() || (isImageMode ? 'Görseldeki soru' : 'Soru metni')}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {LETTERS.map((letter) => (
                              <span
                                key={letter}
                                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-sm font-black ${
                                  draft.correctLetter === letter
                                    ? 'border-teal-500 bg-teal-50 text-teal-800'
                                    : 'border-slate-200 text-slate-500'
                                }`}
                              >
                                {letter}
                              </span>
                            ))}
                          </div>
                          {!isImageMode ? (
                            <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                              {LETTERS.map((letter, optIdx) => (
                                <li key={letter}>
                                  <strong>{letter})</strong> {draft.options[optIdx] || '—'}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <QuestionStemCard
                      question={{
                        topic: sharedTopic,
                        classLevel: sharedClassLevel,
                        introText: sharedIntro,
                        questionText: drafts[0]?.questionText,
                        text: buildCombinedQuestionText(sharedIntro, drafts[0]?.questionText),
                        image: isImageMode ? (effectiveMainImage?.preview || '') : '',
                        assessmentMeta: {
                          contentMode,
                          parseLayout: { introText: sharedIntro, questionLine: drafts[0]?.questionText },
                        },
                      }}
                      showMeta={Boolean(sharedTopic)}
                      showImageInstruction={false}
                    />
                  )}
                </div>
              ) : null}
            </form>
          ) : null}
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
          {!editingId ? (
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Adım {WIZARD_STEP_NUMBERS[wizardStep] || 1} / {WIZARD_STEP_COUNT}
            </span>
          ) : <span />}
          <div className="flex items-center gap-4">
          <button type="button" onClick={onClose} className="px-8 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-all">
            İptal
          </button>
          {wizardStep === 'form' ? (
            <button
              type="button"
              onClick={handleFormSubmit}
              disabled={isSaving}
              className="px-10 py-3 rounded-2xl bg-teal-600 text-white font-black flex items-center gap-2 shadow-xl shadow-teal-100 hover:bg-teal-700 disabled:opacity-50 transition-all"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {editingId
                ? 'Güncelle ve Kaydet'
                : (drafts.length > 1 ? `${drafts.length} Soruyu Kaydet` : 'Soru Bankasına Ekle')}
            </button>
          ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionFormModal;
