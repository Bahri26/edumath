import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Sparkles, Loader2, Image as ImageIcon, Check, ArrowRight, Wand2, CheckCircle, ClipboardPaste } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { describeApiError } from '../../utils/errorMessage';
import apiClient, { resolveAssetUrl } from '../../services/api';
import { smartParseImage } from '../../services/aiService';
import Button from '../ui/Button.jsx';
import { enrichQuestionForm, optionMatchesCorrect } from '../../utils/patternQuestionSolver';
import { normalizeStemFields } from '../../utils/normalizeStemFields';

const stripDiagramPlaceholder = (text) =>
  String(text || '').replace(/\n*\[Şekil:[^\]]+\]\s*/gi, '').trim();

const buildCombinedQuestionText = ({ introText = '', questionText = '' }) =>
  [introText, questionText].map((s) => String(s || '').trim()).filter(Boolean).join('\n\n');

const padOptions = (options, size = 4) => {
  const list = Array.isArray(options) ? options.map((o) => String(o || '').trim()) : [];
  while (list.length < size) list.push('');
  return list.slice(0, size);
};

const LETTERS = ['A', 'B', 'C', 'D'];

const letterFromCorrectAnswer = (options = [], correctAnswer = '') => {
  const ca = String(correctAnswer || '').trim();
  if (!ca) return '';
  if (/^[A-D]$/i.test(ca)) return ca.toUpperCase();
  const idx = options.findIndex((o) => optionMatchesCorrect(o, ca));
  if (idx >= 0 && idx < 4) return LETTERS[idx];
  return '';
};

const answerFromLetter = (letter, options = []) => {
  const L = String(letter || '').toUpperCase();
  const idx = LETTERS.indexOf(L);
  if (idx < 0) return '';
  const opt = String(options[idx] || '').trim();
  // Prefer stored option text when present; otherwise letter (image questions).
  return opt && !/^[A-D]$/i.test(opt) ? opt : L;
};

const toMultiDraft = (item = {}, fallback = {}) => ({
  questionText: String(item.questionText || item.text || '').trim(),
  options: padOptions(item.options || fallback.options, 4),
  correctLetter: letterFromCorrectAnswer(item.options || [], item.correctAnswer || ''),
  difficulty: item.difficulty || fallback.difficulty || 'Orta',
  learningOutcome: item.learningOutcome || fallback.learningOutcome || '',
  solution: item.solution || '',
  assessmentMeta: item.assessmentMeta || null,
  imagePath: item.imagePath || '',
});


const mapServerParseToForm = (data = {}, layout = null) => {
  const intro = data.introText ?? layout?.introText ?? '';
  const question = data.questionText ?? layout?.questionLine ?? stripDiagramPlaceholder(data.text);
  const stem = normalizeStemFields(intro, question);
  const steps = Array.isArray(data.stepLabels) ? data.stepLabels : (layout?.stepLabels || []);
  const stepLabels = steps.join(' · ');
  const diagramImagePath = layout?.diagramImagePath || data.assessmentMeta?.parseLayout?.diagramImagePath || '';
  const questionImagePath = diagramImagePath || data.imagePath || '';
  const base = {
    text: buildCombinedQuestionText({ introText: stem.introText, questionText: stem.questionText }),
    introText: stem.introText,
    questionText: stem.questionText,
    stepLabels,
    visualPrompt: data.visualPrompt || stepLabels || '',
    options: padOptions(data.options),
    correctAnswer: data.correctAnswer || '',
    solution: data.solution || data.solutionText || '',
    topic: data.topic || '',
    subject: data.subject || 'Matematik',
    classLevel: data.classLevel || '9. Sınıf',
    difficulty: data.difficulty || 'Orta',
    imagePath: questionImagePath,
    assessmentMeta: data.assessmentMeta || null,
  };
  return enrichQuestionForm(base);
};

const buildSavePayload = (parsedData, parseLayout) => {
  const introText = parsedData.introText ?? '';
  const questionText = parsedData.questionText ?? '';
  const stepLabels = String(parsedData.stepLabels || '')
    .split(/[·,|]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const parseLayoutNext = {
    ...(parseLayout || parsedData.assessmentMeta?.parseLayout || {}),
    introText,
    questionLine: questionText,
    stepLabels,
    stemText: buildCombinedQuestionText({ introText, questionText }),
  };
  let imagePath = parsedData.imagePath || '';
  if (imagePath && !imagePath.startsWith('/uploads/')) {
    const match = String(imagePath).match(/\/uploads\/[^\s?#]+/i);
    imagePath = match ? match[0] : '';
  }
  return {
    ...parsedData,
    text: buildCombinedQuestionText({ introText, questionText }),
    visualPrompt: parsedData.visualPrompt || parsedData.stepLabels || stepLabels.join(' · '),
    imagePath,
    assessmentMeta: {
      ...(parsedData.assessmentMeta || {}),
      parseLayout: parseLayoutNext,
      source: 'smart-parse',
    },
  };
};

const appendQuestionFormFields = (form, payload) => {
  const skip = new Set(['options', 'assessmentMeta', 'introText', 'questionText', 'stepLabels']);
  Object.entries(payload).forEach(([key, val]) => {
    if (skip.has(key) || val == null || val === '') return;
    form.append(key, String(val));
  });
  form.append('options', JSON.stringify(payload.options || []));
  if (payload.assessmentMeta) {
    form.append('assessmentMeta', JSON.stringify(payload.assessmentMeta));
  }
};

const correctOptionLabel = (options, correctAnswer) => {
  const idx = options.findIndex((o) => optionMatchesCorrect(o, correctAnswer));
  if (idx < 0) return correctAnswer;
  return `${String.fromCharCode(65 + idx)}) ${options[idx]}`;
};

export default function SmartPasteModal({ isOpen, onClose, onParsed }) {
  const { showToast } = useToast();
  const dropRef = useRef(null);
  const fileInputRef = useRef(null);
  const [step, setStep] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [parsedData, setParsedData] = useState({
    text: '',
    introText: '',
    questionText: '',
    stepLabels: '',
    visualPrompt: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    solution: '',
    topic: '',
    subject: 'Matematik',
    classLevel: '9. Sınıf',
    difficulty: 'Orta',
    learningOutcome: '',
    imagePath: '',
    assessmentMeta: null,
  });
  const [parseMode, setParseMode] = useState('');
  const [ocrPreview, setOcrPreview] = useState('');
  const [parseLayout, setParseLayout] = useState(null);
  const [multiItems, setMultiItems] = useState([]);
  const [multiDrafts, setMultiDrafts] = useState([]);
  const [sharedMeta, setSharedMeta] = useState({
    introText: '',
    topic: '',
    classLevel: '5. Sınıf',
    imagePath: '',
  });

  const updateMultiDraft = (index, patch) => {
    setMultiDrafts((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const processImageFile = useCallback(async (file) => {
    if (!file || !String(file.type || '').startsWith('image/')) {
      showToast('Lütfen bir görsel dosyası seçin.', 'error');
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(blobUrl);
    setImage(blobUrl);
    setUploadedFile(file);
    setLoading(true);

    try {
      const body = await smartParseImage(file);
      const data = body?.data || {};
      const mode = body?.meta?.parseMode || '';
      const serverMessage = body?.message;
      const items = Array.isArray(body?.multiItems) ? body.multiItems : [];
      setParseMode(mode);
      setOcrPreview(body?.ocrPreview || '');
      setMultiItems(items);
      setMultiDrafts(items.map((item) => toMultiDraft(item, data)));
      setSharedMeta({
        introText: data.introText || items[0]?.introText || items[0]?.assessmentMeta?.sharedStem || '',
        topic: data.topic || 'Şekil örüntüleri',
        classLevel: data.classLevel || '5. Sınıf',
        imagePath: data.imagePath || items[0]?.imagePath || '',
      });
      const layout = body?.meta?.layout || data?.assessmentMeta?.parseLayout || null;
      setParseLayout(layout);

      const base = mapServerParseToForm(data, layout);
      const form = enrichQuestionForm({
        ...base,
        ocrPreview: body?.ocrPreview || '',
      });
      setParsedData(form);
      setStep('editing');

      if (items.length >= 2) {
        showToast(
          serverMessage || `${items.length} bağlı soru bulundu. Kaydedince hepsi ayrı kayıt olur.`,
          'success',
        );
      } else if (form.correctAnswer?.trim()) {
        showToast(
          layout?.diagramImagePath
            ? `Diyagram kırpıldı ve çözüldü. Doğru şık: ${correctOptionLabel(form.options, form.correctAnswer)}`
            : `Soru analiz edildi ve çözüldü. Doğru şık: ${correctOptionLabel(form.options, form.correctAnswer)}`,
          'success'
        );
      } else if (mode === 'manual') {
        showToast(serverMessage || 'OCR sonuç vermedi. Alanları manuel doldurun.', 'error');
      } else {
        showToast(
          serverMessage || 'Görsel okundu; doğru şık bulunamadı — «Çöz ve işaretle» deneyin.',
          'error'
        );
      }
    } catch (err) {
      setMultiItems([]);
      setMultiDrafts([]);
      setParsedData((prev) => ({
        ...prev,
        options: prev.options?.length ? padOptions(prev.options) : ['', '', '', ''],
        subject: prev.subject || 'Matematik',
        classLevel: prev.classLevel || '9. Sınıf',
        difficulty: prev.difficulty || 'Orta',
      }));
      setStep('editing');
      const status = err?.response?.status;
      if (status === 429) {
        showToast(describeApiError(err, 'AI kotası dolu. Birazdan tekrar deneyin.'), 'error');
      } else if (status === 401 || status === 403) {
        showToast('AI yetki sorunu. Yöneticiye anahtar/izin için bildirin.', 'error');
      } else if (err?.code === 'ECONNABORTED') {
        showToast('Analiz zaman aşımına uğradı. Tekrar deneyin.', 'error');
      } else {
        showToast(describeApiError(err, 'Görsel analiz edilemedi. Alanları elle doldurun.'), 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onPaste = (e) => {
      if (step !== 'upload' || loading) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type?.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) processImageFile(file);
          return;
        }
      }
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [isOpen, step, loading, processImageFile]);

  const resetUploadState = useCallback(() => {
    setLoading(false);
    setImage(null);
    setLocalPreviewUrl('');
    setUploadedFile(null);
    setDragOver(false);
    setParseMode('');
    setOcrPreview('');
    setParseLayout(null);
    setStep('upload');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetUploadState();
    }
  }, [isOpen, resetUploadState]);

  if (!isOpen) return null;

  const parseModeLabel = (mode) => {
    if (mode === 'ai') return 'Bulut AI (Gemini)';
    if (mode === 'ollama-vision') return 'Yerel Ollama görsel';
    if (mode === 'ocr+crop' || mode === 'ocr-regional+crop' || String(mode).includes('diagram')) return 'Yerel OCR + diyagram kırpma';
    if (mode === 'ocr') return 'Yerel OCR + ayrıştırma';
    if (mode === 'manual') return 'Manuel düzenleme';
    return 'Analiz';
  };

  const resolvePreviewSrc = (serverPath) => {
    if (localPreviewUrl) return localPreviewUrl;
    if (serverPath) return resolveAssetUrl(serverPath) || serverPath;
    if (typeof image === 'string' && image) return resolveAssetUrl(image) || image;
    return image || '';
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processImageFile(file);
  };

  const handleAutoSolve = () => {
    const stem = normalizeStemFields(parsedData.introText, parsedData.questionText);
    const enriched = enrichQuestionForm({
      ...parsedData,
      introText: stem.introText,
      questionText: stem.questionText,
      text: buildCombinedQuestionText({
        introText: stem.introText,
        questionText: stem.questionText || parsedData.text,
      }),
      stepLabels: parsedData.stepLabels,
      ocrPreview,
    });
    setParsedData(enriched);
    if (enriched.correctAnswer?.trim()) {
      showToast(`Doğru şık: ${correctOptionLabel(enriched.options, enriched.correctAnswer)}`, 'success');
    } else {
      showToast('Otomatik çözüm bulunamadı. Şıkları kontrol edin.', 'error');
    }
  };

  const postQuestionPayload = async (payload, { attachUpload = false } = {}) => {
    const useDiagramPath = Boolean(
      payload.imagePath?.includes('/temp/crops/')
      || payload.assessmentMeta?.parseLayout?.diagramImagePath
      || parseLayout?.diagramImagePath
    );
    if (useDiagramPath && payload.imagePath) {
      await apiClient.post('/questions', payload);
      return;
    }
    if (attachUpload && uploadedFile) {
      const form = new FormData();
      appendQuestionFormFields(form, payload);
      form.append('image', uploadedFile);
      await apiClient.post('/questions', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return;
    }
    await apiClient.post('/questions', payload);
  };

  const handleFinalSave = async (dataToSave) => {
    setLoading(true);
    try {
      let base = dataToSave || parsedData;
      base = enrichQuestionForm(base);
      setParsedData(base);

      if (multiDrafts.length >= 2) {
        const sharedImage = sharedMeta.imagePath
          || multiItems[0]?.imagePath
          || base.imagePath
          || parseLayout?.diagramImagePath
          || '';
        const groupId = multiItems[0]?.assessmentMeta?.groupId || `multi-${Date.now().toString(36)}`;
        const stem = String(sharedMeta.introText || '').trim();

        for (let i = 0; i < multiDrafts.length; i += 1) {
          const draft = multiDrafts[i];
          const questionLine = String(draft.questionText || '').trim();
          if (!questionLine) {
            showToast(`${i + 1}. soru metni boş.`, 'error');
            return;
          }
          if (!draft.correctLetter) {
            showToast(`${i + 1}. soru için doğru cevabı (A–D) seçin.`, 'error');
            return;
          }
          const options = padOptions(draft.options, 4).map((opt, idx) => {
            const text = String(opt || '').trim();
            return text || LETTERS[idx];
          });
          const correctAnswer = answerFromLetter(draft.correctLetter, options);
          const text = [stem, questionLine].filter(Boolean).join('\n\n');
          const payload = {
            text,
            introText: stem,
            questionText: questionLine,
            options,
            correctAnswer,
            solution: draft.solution || '',
            learningOutcome: draft.learningOutcome || '',
            subject: 'Matematik',
            classLevel: sharedMeta.classLevel || '5. Sınıf',
            topic: sharedMeta.topic || 'Şekil örüntüleri',
            difficulty: draft.difficulty || 'Orta',
            type: 'multiple-choice',
            source: 'Manuel',
            imagePath: sharedImage || undefined,
            assessmentMeta: {
              ...(draft.assessmentMeta || multiItems[i]?.assessmentMeta || {}),
              groupId,
              groupIndex: i + 1,
              groupSize: multiDrafts.length,
              sharedStem: stem,
              sharedImage: sharedImage || '',
              sharedPrompt: 'Aşağıdaki soruları yukarıdaki bilgilere göre cevaplayınız.',
              source: 'smart-parse-multi',
              parseLayout: {
                introText: stem,
                questionLine,
              },
            },
          };
          await postQuestionPayload(payload, {
            attachUpload: i === 0 && Boolean(uploadedFile) && !String(sharedImage).includes('/temp/'),
          });
        }
        showToast(`${multiDrafts.length} bağlı soru havuza kaydedildi.`, 'success');
        onParsed();
        onClose();
        return;
      }

      const payload = { ...buildSavePayload(base, parseLayout), source: 'Manuel' };

      if (!payload.text?.trim()) {
        showToast('Soru metni boş olamaz.', 'error');
        return;
      }
      if (!payload.correctAnswer?.trim()) {
        showToast('Doğru cevap otomatik bulunamadı. Şıkları kontrol edin.', 'error');
        return;
      }

      await postQuestionPayload(payload, { attachUpload: true });

      showToast('Soru başarıyla havuza kaydedildi!', 'success');
      onParsed();
      onClose();
    } catch (err) {
      showToast(describeApiError(err, 'Kaydedilirken bir hata oluştu.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferToCreate = () => {
    const enriched = enrichQuestionForm(parsedData);
    onParsed(buildSavePayload(enriched, parseLayout), uploadedFile);
    onClose();
  };

  const diagramSrc = parseLayout?.diagramImagePath
    ? resolvePreviewSrc(parseLayout.diagramImagePath)
    : resolvePreviewSrc(parsedData.imagePath);
  const hasShapeSection = Boolean(
    diagramSrc || parseLayout?.hasDiagram || parsedData.introText || parsedData.stepLabels
  );

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Akıllı görsel analiz"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="bg-white dark:bg-surface-800 w-full max-w-4xl rounded-[2rem] shadow-soft overflow-hidden flex flex-col animate-scale-in border border-surface-200/60 dark:border-surface-700">

        <div className="p-6 bg-gradient-to-r from-teal-700 to-sky-700 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Sparkles className={loading ? 'animate-spin' : ''} /></div>
            <div>
              <h3 className="font-display text-xl font-semibold">Akıllı Yapıştır</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
                {step === 'upload' ? 'Görsel → analiz → çözüm' : `${parseModeLabel(parseMode)} · doğrulama`}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose} ariaLabel="Kapat">
            <X size={16} />
          </Button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {step === 'upload' ? (
            <div className="space-y-6">
              <div
                ref={dropRef}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center w-full h-80 border-4 border-dashed rounded-[2rem] cursor-pointer transition-all group ${
                  dragOver
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30'
                    : 'border-surface-200 dark:border-surface-700 hover:border-teal-300 hover:bg-teal-50/30'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                  <div className="p-5 bg-teal-50 dark:bg-teal-900/30 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    {dragOver ? <ClipboardPaste className="text-teal-600" size={48} /> : <ImageIcon className="text-teal-600" size={48} />}
                  </div>
                  <p className="mb-2 text-lg font-display font-semibold text-surface-800 dark:text-surface-200">
                    Soru görselini buraya bırakın veya yapıştırın
                  </p>
                  <p className="text-sm text-slate-400 font-medium text-center px-10">
                    Ekran görüntüsü alın (Win+Shift+S), sonra <strong>Ctrl+V</strong> ile yapıştırın.
                    <br />
                    Sistem OCR ile okur, soruyu çözer ve doğru şıkkı işaretler.
                    <br />
                    <span className="text-teal-600 dark:text-teal-400">Görsel soru köküne eklenir; şıklar yalnızca metin olur.</span>
                  </p>
                  <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-teal-600">
                    Ctrl+V · sürükle-bırak · dosya seç
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              {loading && (
                <div className="flex items-center justify-center gap-3 text-teal-600 font-bold animate-pulse">
                  <Loader2 className="animate-spin" /> OCR, çözüm ve şık işaretleme…
                </div>
              )}
            </div>
          ) : multiDrafts.length >= 2 ? (
            <div className="space-y-6">
              <div
                className="rounded-xl border border-teal-300 bg-teal-50 px-4 py-3 text-sm text-teal-950 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-100"
                role="status"
              >
                <strong className="font-black">{multiDrafts.length} bağlı soru</strong> — her madde için metin,
                doğru cevap (A–D), zorluk, kazanım ve çözüm girin. Şık metinleri görselde; burada yalnızca harf seçilir.
              </div>

              <section className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ortak görsel / giriş</p>
                {(diagramSrc || localPreviewUrl) ? (
                  <img
                    src={diagramSrc || localPreviewUrl}
                    alt="Ortak soru görseli"
                    className="max-h-56 w-full rounded-xl border border-slate-200 bg-white object-contain dark:border-slate-600 dark:bg-slate-900"
                    onError={(ev) => {
                      if (localPreviewUrl && ev.currentTarget.src !== localPreviewUrl) {
                        ev.currentTarget.src = localPreviewUrl;
                      }
                    }}
                  />
                ) : null}
                <textarea
                  value={sharedMeta.introText}
                  onChange={(e) => setSharedMeta((s) => ({ ...s, introText: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border-none bg-white p-3 text-sm outline-none ring-teal-400 focus:ring-2 dark:bg-slate-900"
                  placeholder="Ortak giriş metni (üst açıklama)"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Konu</label>
                    <input
                      value={sharedMeta.topic}
                      onChange={(e) => setSharedMeta((s) => ({ ...s, topic: e.target.value }))}
                      className="w-full rounded-xl border-none bg-white p-3 text-sm font-medium outline-none dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">Sınıf</label>
                    <select
                      value={sharedMeta.classLevel}
                      onChange={(e) => setSharedMeta((s) => ({ ...s, classLevel: e.target.value }))}
                      className="w-full rounded-xl border-none bg-white p-3 text-sm font-bold outline-none dark:bg-slate-800"
                    >
                      {Array.from({ length: 12 }, (_, i) => `${i + 1}. Sınıf`).map((cl) => (
                        <option key={cl}>{cl}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {multiDrafts.map((draft, index) => (
                <section
                  key={`multi-${index}`}
                  className="space-y-4 rounded-[1.5rem] border-2 border-teal-200/80 bg-white p-5 dark:border-teal-900/50 dark:bg-surface-800"
                >
                  <h4 className="font-display text-lg font-semibold text-teal-800 dark:text-teal-200">
                    {index + 1}. Soru
                  </h4>

                  <div>
                    <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Soru metni
                    </label>
                    <textarea
                      value={draft.questionText}
                      onChange={(e) => updateMultiDraft(index, { questionText: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl border-none bg-slate-50 p-3 text-sm font-medium outline-none ring-teal-500 focus:ring-2 dark:bg-slate-900"
                      placeholder={`${index + 1}. sorunun metni`}
                    />
                  </div>

                  <div>
                    <label className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Doğru cevap (4 şık · A–D)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {LETTERS.map((letter) => {
                        const selected = draft.correctLetter === letter;
                        return (
                          <button
                            key={letter}
                            type="button"
                            onClick={() => updateMultiDraft(index, { correctLetter: letter })}
                            className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-lg font-black transition-all ${
                              selected
                                ? 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-300/40 dark:bg-teal-950/40 dark:text-teal-100'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
                            }`}
                            aria-pressed={selected}
                            aria-label={`${index + 1}. soru doğru cevap ${letter}`}
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Zorluk seviyesi
                      </label>
                      <select
                        value={draft.difficulty}
                        onChange={(e) => updateMultiDraft(index, { difficulty: e.target.value })}
                        className="w-full rounded-xl border-none bg-slate-50 p-3 text-sm font-bold outline-none dark:bg-slate-900"
                      >
                        {['Kolay', 'Orta', 'Zor'].map((lv) => (
                          <option key={lv}>{lv}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 ml-1 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Kazanım
                      </label>
                      <input
                        value={draft.learningOutcome}
                        onChange={(e) => updateMultiDraft(index, { learningOutcome: e.target.value })}
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
                      value={draft.solution}
                      onChange={(e) => updateMultiDraft(index, { solution: e.target.value })}
                      rows={2}
                      className="w-full rounded-xl border-none bg-slate-50 p-3 text-sm outline-none dark:bg-slate-900"
                      placeholder="Kısa çözüm"
                    />
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div
                className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
                role="status"
              >
                <strong className="font-black">Doğrulama gerekli:</strong> Kaydetmeden önce soru metnini, şıkları ve
                işaretli doğru cevabı kontrol edin. OCR/AI hatalı okuyabilir.
              </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
              <div className="space-y-5">
                {hasShapeSection ? (
                  <section className="rounded-[1.75rem] border-2 border-amber-200/90 bg-amber-50/40 dark:bg-amber-950/25 p-5 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-200">1 · Şekil / diyagram</p>
                    {diagramSrc ? (
                      <img
                        src={diagramSrc}
                        alt="Soru şekli"
                        onError={(ev) => {
                          if (localPreviewUrl && ev.currentTarget.src !== localPreviewUrl) {
                            ev.currentTarget.src = localPreviewUrl;
                          }
                        }}
                        className="w-full max-h-44 object-contain rounded-xl border border-amber-200/80 bg-white dark:bg-slate-900"
                      />
                    ) : null}
                    <div>
                      <label className="text-[10px] font-bold uppercase text-amber-900/80 ml-1 mb-1 block">Üst açıklama (giriş)</label>
                      <textarea
                        value={parsedData.introText}
                        onChange={(e) => setParsedData({ ...parsedData, introText: e.target.value })}
                        rows={2}
                        className="w-full p-3 bg-white/80 dark:bg-slate-900 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="Örn. Altıgenlerle oluşturulmuş bir örüntünün ilk üç adımı verilmiştir."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-amber-900/80 ml-1 mb-1 block">Adım etiketleri (OCR)</label>
                      <input
                        value={parsedData.stepLabels}
                        onChange={(e) => setParsedData({
                          ...parsedData,
                          stepLabels: e.target.value,
                          visualPrompt: e.target.value,
                        })}
                        className="w-full p-3 bg-white/80 dark:bg-slate-900 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="1. Adım · 2. Adım · 3. Adım"
                      />
                    </div>
                  </section>
                ) : null}

                <section className="rounded-[1.75rem] border-2 border-teal-200/90 bg-teal-50/30 dark:bg-teal-950/20 p-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-teal-800 dark:text-teal-200">2 · Soru metni</p>
                  <textarea
                    value={parsedData.questionText}
                    onChange={(e) => setParsedData({ ...parsedData, questionText: e.target.value })}
                    rows={4}
                    className="w-full p-4 bg-white/90 dark:bg-slate-900 border-none rounded-[1.25rem] font-medium outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Buna göre örüntünün 42. adımında kaç tane altıgen vardır?"
                  />
                </section>

                <section className="rounded-[1.75rem] border border-slate-200 dark:border-slate-700 p-5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block tracking-widest">Çözüm adımları</label>
                  <textarea
                    value={parsedData.solution}
                    onChange={(e) => setParsedData({ ...parsedData, solution: e.target.value })}
                    className="w-full h-28 p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-[1.25rem] text-sm outline-none"
                    placeholder="Otomatik doldurulur; gerekirse düzenleyin."
                  />
                </section>

                {ocrPreview ? (
                  <details className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-xs">
                    <summary className="font-bold cursor-pointer text-slate-500">OCR ham metin</summary>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] opacity-80 max-h-28 overflow-y-auto">{ocrPreview}</pre>
                  </details>
                ) : null}
              </div>

              <div className="space-y-5">
                <section className="rounded-[1.75rem] border-2 border-emerald-200/90 bg-emerald-50/25 dark:bg-emerald-950/20 p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-200">3 · Doğru cevap (A–D)</p>
                    <button
                      type="button"
                      onClick={handleAutoSolve}
                      className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/70 dark:bg-slate-900/50"
                    >
                      <Wand2 size={12} /> Çöz ve işaretle
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {LETTERS.map((letter, idx) => {
                      const opt = parsedData.options[idx] || letter;
                      const selected = optionMatchesCorrect(opt, parsedData.correctAnswer)
                        || letterFromCorrectAnswer(parsedData.options, parsedData.correctAnswer) === letter;
                      return (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => setParsedData({
                            ...parsedData,
                            options: padOptions(parsedData.options, 4).map((o, i) => o || LETTERS[i]),
                            correctAnswer: answerFromLetter(letter, parsedData.options),
                          })}
                          className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-lg font-black ${
                            selected
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-white text-slate-600'
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block tracking-widest">Konu</label>
                    <input
                      value={parsedData.topic}
                      onChange={(e) => setParsedData({ ...parsedData, topic: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-medium outline-none"
                      placeholder="Örn. Örüntüler"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block tracking-widest">Zorluk</label>
                    <select
                      value={parsedData.difficulty}
                      onChange={(e) => setParsedData({ ...parsedData, difficulty: e.target.value })}
                      className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border-none text-xs font-bold shadow-sm outline-none"
                    >
                      {['Kolay', 'Orta', 'Zor'].map((lv) => <option key={lv}>{lv}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block tracking-widest">Sınıf</label>
                    <select
                      value={parsedData.classLevel}
                      onChange={(e) => setParsedData({ ...parsedData, classLevel: e.target.value })}
                      className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border-none text-xs font-bold shadow-sm outline-none"
                    >
                      {['1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf', '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf'].map((cl) => <option key={cl}>{cl}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block tracking-widest">Kazanım</label>
                  <input
                    value={parsedData.learningOutcome || ''}
                    onChange={(e) => setParsedData({ ...parsedData, learningOutcome: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm outline-none"
                    placeholder="Öğrenme kazanımı"
                  />
                </div>
                <details className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                  <summary className="text-[10px] font-black uppercase text-slate-500 cursor-pointer">Kaynak görsel (tam ekran)</summary>
                  <img
                    src={resolvePreviewSrc(parsedData.imagePath)}
                    alt="Kaynak soru görseli"
                    onError={(ev) => {
                      if (localPreviewUrl && ev.currentTarget.src !== localPreviewUrl) {
                        ev.currentTarget.src = localPreviewUrl;
                      }
                    }}
                    className="mt-3 w-full max-h-32 object-contain rounded-lg bg-slate-50 dark:bg-slate-900"
                  />
                </details>
              </div>
            </div>
            </div>
          )}
        </div>

        <div className="p-8 pt-0 flex gap-4 justify-end">
          <Button variant="outline" size="md" onClick={onClose}>İptal</Button>
          {step === 'editing' && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={handleTransferToCreate}
                disabled={loading}
              >
                <ArrowRight size={18} /> Soru Oluşturmaya Aktar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleFinalSave()}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}{' '}
                {multiDrafts.length >= 2 ? `${multiDrafts.length} Soruyu Kaydet` : 'Havuza Kaydet'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
