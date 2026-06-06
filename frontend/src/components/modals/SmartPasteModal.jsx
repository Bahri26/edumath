import React, { useState } from 'react';
import { X, Sparkles, Loader2, Image as ImageIcon, Check, ArrowRight, Wand2, CheckCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { describeApiError } from '../../utils/errorMessage';
import apiClient, { resolveAssetUrl } from '../../services/api';
import { smartParseImage, smartParseText } from '../../services/aiService';
import Button from '../ui/Button.jsx';
import { enrichQuestionForm, optionMatchesCorrect } from '../../utils/patternQuestionSolver';

const stripDiagramPlaceholder = (text) =>
  String(text || '').replace(/\n*\[Şekil:[^\]]+\]\s*/gi, '').trim();

const buildCombinedQuestionText = ({ introText = '', questionText = '' }) =>
  [introText, questionText].map((s) => String(s || '').trim()).filter(Boolean).join('\n\n');

const mapServerParseToForm = (data = {}, layout = null) => {
  const intro = data.introText ?? layout?.introText ?? '';
  const question = data.questionText ?? layout?.questionLine ?? stripDiagramPlaceholder(data.text);
  const steps = Array.isArray(data.stepLabels) ? data.stepLabels : (layout?.stepLabels || []);
  const stepLabels = steps.join(' · ');
  return enrichQuestionForm({
    text: buildCombinedQuestionText({ introText: intro, questionText: question }),
    introText: intro,
    questionText: question,
    stepLabels,
    visualPrompt: data.visualPrompt || stepLabels || '',
    options: Array.isArray(data.options) ? data.options : ['', '', '', ''],
    correctAnswer: data.correctAnswer || '',
    solution: data.solution || data.solutionText || '',
    topic: data.topic || '',
    subject: data.subject || 'Matematik',
    classLevel: data.classLevel || '9. Sınıf',
    difficulty: data.difficulty || 'Orta',
    imagePath: data.imagePath || '',
    assessmentMeta: data.assessmentMeta || null,
  });
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

export default function SmartPasteModal({ isOpen, onClose, onParsed }) {
  const { showToast } = useToast();
  const [mode, setMode] = useState('image'); // 'image' | 'text'
  const [step, setStep] = useState('upload'); // 'upload' | 'editing'
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pastedContent, setPastedContent] = useState('');
  
  // Düzenleme State'i
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
    imagePath: '',
    assessmentMeta: null,
  });
  const [parseMode, setParseMode] = useState('');
  const [ocrPreview, setOcrPreview] = useState('');
  const [parseLayout, setParseLayout] = useState(null);

  if (!isOpen) return null;

  const parseModeLabel = (mode) => {
    if (mode === 'ai') return 'Bulut AI (Gemini)';
    if (mode === 'ollama-vision') return 'Yerel Ollama görsel';
    if (mode === 'ocr+crop') return 'Yerel OCR + diyagram kırpma';
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
      setParseMode(mode);
      setOcrPreview(body?.ocrPreview || '');
      const layout = body?.meta?.layout || data?.assessmentMeta?.parseLayout || null;
      setParseLayout(layout);
      setParsedData(mapServerParseToForm(data, layout));
      // Önizleme: tarayıcıdaki blob URL korunur; sunucu yolu yalnızca kayıt için
      setStep('editing');
      if (mode === 'manual') {
        showToast(serverMessage || 'AI ve OCR sonuç vermedi. Alanları manuel doldurun.', 'error');
      } else if (mode === 'ocr+crop' || mode === 'ocr' || mode === 'ollama-vision') {
        showToast(serverMessage || 'Görsel soruya dönüştürüldü. Alanları kontrol edin.', 'success');
      } else {
        showToast(serverMessage || 'Görsel analiz edildi.', 'success');
      }
    } catch (err) {
      // Fallback to manual: keep local preview and open editing with blanks
      setParsedData(prev => ({
        text: prev.text || '',
        options: prev.options?.length ? prev.options : ['', '', '', ''],
        correctAnswer: prev.correctAnswer || '',
        solution: prev.solution || '',
        subject: prev.subject || 'Matematik',
        classLevel: prev.classLevel || '9. Sınıf',
        difficulty: prev.difficulty || 'Orta'
      }));
      setStep('editing');
      const status = err?.response?.status;
      if (status === 429) {
        showToast(describeApiError(err, 'AI kotası dolu. Birazdan tekrar deneyin.'), 'error');
      } else if (status === 401 || status === 403) {
        showToast('AI yetki sorunu. Yöneticiye anahtar/izin için bildirin.', 'error');
      } else if (err?.code === 'ECONNABORTED') {
        showToast('AI yanıt zaman aşımına uğradı. Tekrar deneyin.', 'error');
      } else {
        showToast(describeApiError(err, 'Görsel analiz edilemedi. Alanları elle doldurun.'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // 1.b Metinden Ayrıştırma (Copy-Paste)
  const handleTextParse = async (contentToParse) => {
    const content = (contentToParse ?? pastedContent).replace(/\r/g, '').trim();
    if (!content) {
      showToast('Lütfen metni yapıştırın', 'error');
      return false;
    }
    setLoading(true);
    try {
      // 1) Soru metnini, 2) Şıkları ve 3) Cevabı ayrıştır
      const firstOptionIndex = content.search(/[A-Ha-h]\)/);
      const questionText = firstOptionIndex > -1 ? content.slice(0, firstOptionIndex).trim() : content.trim();

      // Şıklar: "A) ... B) ... C) ... D) ..." tek satır veya çok satır
      // Önce cevap satırını ayıkla ki şık olarak yakalanmasın
      const contentNoAnswer = content.replace(/(^|\n)\s*C(e|ı|i)vap\s*:.*/i, '').trim();
      const optionPattern = /([A-Ha-h])\)\s*([\s\S]*?)(?=\s+[A-Ha-h]\)|\s*$)/g;
      const optionMatches = [...contentNoAnswer.matchAll(optionPattern)];
      let options = optionMatches.map(m => m[2].replace(/\s+/g, ' ').trim());

      // Çok satırlı format için ek deneme
      if (options.length === 0) {
        const linePattern = /^\s*([A-Ha-h])\)\s*(.+)$/gm;
        options = [...content.matchAll(linePattern)].map(m => m[2].trim());
      }

      // Cevap satırı: "Cevap: C) 28" veya "Cevap: C" veya "Cevap: 28"
      const answerLine = content.match(/Cevap\s*:?\s*(.+)$/im);
      let correctAnswer = '';
      if (answerLine) {
        const ansStr = (answerLine[1] || '').trim();
        const letterMatch = ansStr.match(/^([A-Ha-h])\)/);
        const bareLetter = ansStr.match(/^([A-Ha-h])$/);
        const valueMatch = ansStr.replace(/^([A-Ha-h])\)\s*/, '').trim();
        if (letterMatch || bareLetter) {
          const letter = (letterMatch ? letterMatch[1] : bareLetter[1]).toUpperCase();
          const idx = letter.charCodeAt(0) - 65;
          correctAnswer = options[idx] || valueMatch || '';
        } else if (valueMatch) {
          // Değer verilmişse, şıklar içinde eşleşeni işaretle
          const found = options.find(o => String(o).trim().toLowerCase() === valueMatch.trim().toLowerCase());
          correctAnswer = found || valueMatch;
        }
      }

      // Min 2 şık olacak şekilde doldur, fazla şıklar olduğu kadar bırak (A-H destek)
      if (options.length < 2) {
        options = options.concat(Array(2 - options.length).fill(''));
      }

      const parsed = enrichQuestionForm({
        text: questionText,
        options,
        correctAnswer,
        solution: parsedData.solution || '',
        topic: parsedData.topic || '',
        subject: parsedData.subject || 'Matematik',
        classLevel: parsedData.classLevel || '9. Sınıf',
        difficulty: parsedData.difficulty || 'Orta'
      });

      setParsedData(parsed);
      setStep('editing');
      showToast('Metin ayrıştırıldı. Şıklar ve doğru cevap işaretlendi.', 'success');
      // Otomatik havuza kaydet
      await handleFinalSave(parsed);
      return true;
    } catch (err) {
      // Backend'e fallback (opsiyonel)
      try {
        const body = await smartParseText(content);
        setParsedData(body.data);
        setStep('editing');
        showToast('Metin ayrıştırıldı (AI).', 'success');
        await handleFinalSave(body.data);
        return true;
      } catch {
        showToast('Metin ayrıştırılamadı', 'error');
        return false;
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Havuza Kaydetme
  const handleFinalSave = async (dataToSave) => {
    setLoading(true);
    try {
      const base = dataToSave || parsedData;
      const payload = { ...buildSavePayload(base, parseLayout), source: 'AI' };

      if (!payload.text?.trim()) {
        showToast('Soru metni boş olamaz.', 'error');
        return;
      }
      if (!payload.correctAnswer?.trim()) {
        showToast('Doğru cevabı işaretleyin.', 'error');
        return;
      }

      if (uploadedFile) {
        const form = new FormData();
        appendQuestionFormFields(form, payload);
        form.append('image', uploadedFile);
        await apiClient.post('/questions', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await apiClient.post('/questions', payload);
      }

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
    onParsed(buildSavePayload(parsedData, parseLayout), uploadedFile);
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
      aria-label="Akıllı görsel/metin analiz"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Sparkles className={loading ? "animate-spin" : ""} /></div>
            <div>
              <h3 className="text-xl font-black">Akıllı Yapıştır</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
                {step === 'upload' ? 'Görsel → soru' : `${parseModeLabel(parseMode)} · doğrulama`}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose} ariaLabel="Kapat">
            <X size={16} />
          </Button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {step === 'upload' ? (
            /* ADIM 1: YÜKLEME ALANI */
            <div className="space-y-6">
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <Button variant={mode==='image'?'primary':'outline'} size="sm" onClick={()=>setMode('image')}>Görselden Analiz</Button>
                <Button variant={mode==='text'?'primary':'outline'} size="sm" onClick={()=>setMode('text')}>Kopyala-Yapıştır</Button>
              </div>

              {mode === 'image' ? (
              <label className="flex flex-col items-center justify-center w-full h-80 border-4 border-dashed border-slate-100 dark:border-slate-700 rounded-[3rem] cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon className="text-indigo-600" size={48} />
                  </div>
                  <p className="mb-2 text-lg font-black text-slate-700 dark:text-slate-200">Soru Resmini Buraya Bırakın</p>
                  <p className="text-sm text-slate-400 font-medium text-center px-10">
                    Net ekran görüntüsü kullanın. Sistem metni okur (OCR), şıkları ve cevabı ayırır;
                    <br /> sonra siz kontrol edip havuza kaydedersiniz.
                  </p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
              ) : (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Soruyu Buraya Yapıştırın</label>
                  <textarea 
                    value={pastedContent}
                    onChange={e=>setPastedContent(e.target.value)}
                    onPaste={async (e) => {
                      // Klasik yapıştırma işlemini bekle, sonra ayrıştır
                      setTimeout(async () => {
                        const pasted = e.clipboardData.getData('text');
                        setPastedContent(pasted);
                        await handleTextParse(pasted);
                      }, 0);
                    }}
                    className="w-full h-64 p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-[1.5rem] font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={"Örn. soru metni ve A) B) C) D) şeklinde şıklar..."}
                  />
                  <div className="flex justify-end">
                    <Button variant="primary" size="md" onClick={()=>handleTextParse()} disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />} Ayrıştır
                    </Button>
                  </div>
                </div>
              )}
              {loading && (
                <div className="flex items-center justify-center gap-3 text-indigo-600 font-bold animate-pulse">
                  <Loader2 className="animate-spin" /> OCR, diyagram kırpma ve şık ayrıştırması…
                </div>
              )}
            </div>
          ) : (
            /* ADIM 2: Şekil | Soru | Şıklar — ayrı bloklar */
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

                <section className="rounded-[1.75rem] border-2 border-indigo-200/90 bg-indigo-50/30 dark:bg-indigo-950/20 p-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-800 dark:text-indigo-200">2 · Soru metni</p>
                  <textarea
                    value={parsedData.questionText}
                    onChange={(e) => setParsedData({ ...parsedData, questionText: e.target.value })}
                    rows={4}
                    className="w-full p-4 bg-white/90 dark:bg-slate-900 border-none rounded-[1.25rem] font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Buna göre örüntünün 42. adımında kaç tane altıgen vardır?"
                  />
                </section>

                <section className="rounded-[1.75rem] border border-slate-200 dark:border-slate-700 p-5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block tracking-widest">Çözüm ve açıklama</label>
                  <textarea
                    value={parsedData.solution}
                    onChange={(e) => setParsedData({ ...parsedData, solution: e.target.value })}
                    className="w-full h-28 p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-[1.25rem] text-sm italic outline-none"
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-200">3 · Şıklar ve doğru cevap</p>
                    <button
                      type="button"
                      onClick={() => setParsedData(enrichQuestionForm(parsedData))}
                      className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/70 dark:bg-slate-900/50"
                    >
                      <Wand2 size={12} /> Çöz ve işaretle
                    </button>
                  </div>
                  {parsedData.correctAnswer?.trim() ? (
                    <p className="text-xs font-bold text-emerald-700">
                      Doğru şık: {parsedData.options.findIndex((o) => optionMatchesCorrect(o, parsedData.correctAnswer)) >= 0
                        ? `${String.fromCharCode(65 + parsedData.options.findIndex((o) => optionMatchesCorrect(o, parsedData.correctAnswer)))}) ${parsedData.correctAnswer}`
                        : parsedData.correctAnswer}
                    </p>
                  ) : null}
                  <div className="space-y-3">
                    {parsedData.options.map((opt, idx) => {
                      const isCorrect = optionMatchesCorrect(opt, parsedData.correctAnswer);
                      return (
                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${isCorrect ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 dark:border-slate-700'}`}>
                        <button 
                          type="button"
                          onClick={() => setParsedData({...parsedData, correctAnswer: opt})}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}
                        >
                          {isCorrect ? <CheckCircle size={14} /> : String.fromCharCode(65 + idx)}
                        </button>
                        <input 
                          value={opt} 
                          onChange={e => {
                            const newOpts = [...parsedData.options];
                            const prevVal = newOpts[idx];
                            newOpts[idx] = e.target.value;
                            const next = { ...parsedData, options: newOpts };
                            if (optionMatchesCorrect(prevVal, parsedData.correctAnswer)) {
                              next.correctAnswer = e.target.value;
                            }
                            setParsedData(next);
                          }}
                          className="bg-transparent border-none outline-none text-sm font-bold flex-1"
                        />
                      </div>
                    );})}
                  </div>
                </section>
                {/* Konu, Zorluk, Sınıf */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block tracking-widest">Konu</label>
                    <input 
                      value={parsedData.topic}
                      onChange={e => setParsedData({ ...parsedData, topic: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-medium outline-none"
                      placeholder="Örn. Örüntüler"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block tracking-widest">Zorluk</label>
                    <select 
                      value={parsedData.difficulty}
                      onChange={e => setParsedData({ ...parsedData, difficulty: e.target.value })}
                      className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border-none text-xs font-bold shadow-sm outline-none"
                    >
                      {['Kolay','Orta','Zor'].map(lv => <option key={lv}>{lv}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block tracking-widest">Sınıf</label>
                    <select 
                      value={parsedData.classLevel}
                      onChange={e => setParsedData({ ...parsedData, classLevel: e.target.value })}
                      className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border-none text-xs font-bold shadow-sm outline-none"
                    >
                      {['1. Sınıf','2. Sınıf','3. Sınıf','4. Sınıf','5. Sınıf','6. Sınıf','7. Sınıf','8. Sınıf','9. Sınıf','10. Sınıf','11. Sınıf','12. Sınıf'].map(cl => <option key={cl}>{cl}</option>)}
                    </select>
                  </div>
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
          )}
        </div>

        {/* Footer */}
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
                onClick={handleFinalSave}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} Havuza Kaydet
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}