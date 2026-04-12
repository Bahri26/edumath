import React, { useState } from 'react';
import { X, Sparkles, Loader2, Image as ImageIcon, Check, ArrowRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/api';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

export default function SmartPasteModal({ isOpen, onClose, onParsed }) {
  const { showToast } = useToast();
  const [mode, setMode] = useState('image'); // 'image' | 'text'
  const [step, setStep] = useState('upload'); // 'upload' | 'editing'
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pastedContent, setPastedContent] = useState('');
  
  // Düzenleme State'i
  const [parsedData, setParsedData] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    solution: '',
    topic: '',
    subject: 'Matematik',
    classLevel: '9. Sınıf',
    difficulty: 'Orta'
  });

  if (!isOpen) return null;

  // 1. Resimden Metne Dönüştürme (Gemini AI API)
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
    setUploadedFile(file);
    setLoading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      // Backend'deki multimodal Gemini Flash endpoint'ini çağırıyoruz
      const res = await apiClient.post('/ai/smart-parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = res.data?.data || {};
      setParsedData({
        text: data.text || '',
        options: Array.isArray(data.options) ? data.options : ['', '', '', ''],
        correctAnswer: data.correctAnswer || '',
        solution: data.solution || data.solutionText || '',
        topic: data.topic || '',
        subject: data.subject || 'Matematik',
        classLevel: data.classLevel || '9. Sınıf',
        difficulty: data.difficulty || 'Orta'
      });
      // If server returned an imagePath, prefer it for preview
      if (data.imagePath) {
        setImage(data.imagePath);
      }
      setStep('editing'); // Düzenleme aşamasına geç
      showToast("Görsel analiz edildi veya manuel düzenleme için hazır.", "success");
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
      showToast("AI anahtarı geçersiz. Lütfen metni elle düzenleyin veya Kopyala‑Yapıştır modunu kullanın.", "error");
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

      const parsed = {
        text: questionText,
        options,
        correctAnswer,
        solution: parsedData.solution || '',
        topic: parsedData.topic || '',
        subject: parsedData.subject || 'Matematik',
        classLevel: parsedData.classLevel || '9. Sınıf',
        difficulty: parsedData.difficulty || 'Orta'
      };

      setParsedData(parsed);
      setStep('editing');
      showToast('Metin ayrıştırıldı. Şıklar ve doğru cevap işaretlendi.', 'success');
      // Otomatik havuza kaydet
      await handleFinalSave(parsed);
      return true;
    } catch (err) {
      // Backend'e fallback (opsiyonel)
      try {
        const res = await apiClient.post('/ai/smart-parse-text', { content });
        setParsedData(res.data.data);
        setStep('editing');
        showToast('Metin ayrıştırıldı (AI).', 'success');
        await handleFinalSave(res.data.data);
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
      const payload = { ...(dataToSave || parsedData), source: 'AI' };
      // If backend provided a temp image path and user didn't reupload a file, pass it through
      if (typeof image === 'string' && (image.startsWith('/uploads/') || /^https?:\/\//i.test(image))) {
        payload.imagePath = image;
      }
      await apiClient.post('/questions', payload);
      showToast("Soru başarıyla havuza kaydedildi!", "success");
      onParsed(); // Listeyi yenile
      onClose(); // Modalı kapat
    } catch (err) {
      showToast("Kaydedilirken bir hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferToCreate = () => {
    // Soru oluşturma formuna aktar ve modalı kapat
    onParsed(parsedData, uploadedFile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl"><Sparkles className={loading ? "animate-spin" : ""} /></div>
            <div>
              <h3 className="text-xl font-black">AI Akıllı Görsel Analiz</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Adım: {step === 'upload' ? 'Görsel Seçimi' : 'Veri Doğrulama'}</p>
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
                  <p className="text-sm text-slate-400 font-medium text-center px-10">Net bir ekran görüntüsü veya fotoğraf, yapay zekanın <br/> daha iyi sonuç vermesini sağlar.</p>
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
                  <Loader2 className="animate-spin" /> Görsel analiz ediliyor ve LaTeX'e dönüştürülüyor...
                </div>
              )}
            </div>
          ) : (
            /* ADIM 2: DÜZENLEME ALANI */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block tracking-widest">Soru Metni (LaTeX)</label>
                  <textarea 
                    value={parsedData.text} 
                    onChange={e => setParsedData({...parsedData, text: e.target.value})}
                    className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-[1.5rem] font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block tracking-widest">💡 Çözüm ve Açıklama</label>
                  <textarea 
                    value={parsedData.solution} 
                    onChange={e => setParsedData({...parsedData, solution: e.target.value})}
                    className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-[1.5rem] text-sm italic outline-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-2 block tracking-widest">📋 Şıklar ve Doğru Cevap</label>
                  <div className="space-y-3">
                    {parsedData.options.map((opt, idx) => (
                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${parsedData.correctAnswer === opt ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 dark:border-slate-700'}`}>
                        <button 
                          onClick={() => setParsedData({...parsedData, correctAnswer: opt})}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${parsedData.correctAnswer === opt ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </button>
                        <input 
                          value={opt} 
                          onChange={e => {
                            const newOpts = [...parsedData.options];
                            newOpts[idx] = e.target.value;
                            setParsedData({...parsedData, options: newOpts});
                          }}
                          className="bg-transparent border-none outline-none text-sm font-bold flex-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {/* Ek Alanlar: Konu, Zorluk, Sınıf */}
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
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-[2rem] border border-indigo-100">
                   <p className="text-[10px] font-black text-indigo-600 uppercase mb-3">Soru Önizleme (Görsel)</p>
                   <img src={image} alt="Original" className="w-full h-32 object-contain rounded-xl opacity-60 grayscale hover:grayscale-0 transition-all cursor-zoom-in" />
                </div>
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