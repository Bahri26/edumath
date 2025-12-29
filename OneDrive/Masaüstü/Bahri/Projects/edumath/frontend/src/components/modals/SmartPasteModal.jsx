import React, { useState, useEffect } from 'react';
import { Clipboard, X, FileText, CheckCircle2, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import apiClient from '../../services/api'; // API servisinizi import edin

export default function SmartPasteModal({ isOpen, onClose, onConvert }) {
  const [text, setText] = useState('');
  const [pastedImage, setPastedImage] = useState(null); // Dosya objesi
  const [imagePreview, setImagePreview] = useState(null); // Önizleme URL'i
  const [loading, setLoading] = useState(false);

  // Modal her açıldığında state'leri sıfırla
  useEffect(() => {
    if (isOpen) {
      setText('');
      setPastedImage(null);
      setImagePreview(null);
      setLoading(false);
    }
  }, [isOpen]);

  // --- RESİM YAPIŞTIRMA MANTIĞI ---
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault(); // Metin olarak yapışmasını engelle
        const blob = items[i].getAsFile();
        setPastedImage(blob);
        setImagePreview(URL.createObjectURL(blob));
        return; // Sadece ilk resmi al
      }
    }
  };

  // --- İŞLEM MANTIĞI (METİN veya RESİM) ---
  const handleProcess = async () => {
    if (!text.trim() && !pastedImage) return;

    // 1. DURUM: RESİM VARSA (BACKEND'E GİT)
    if (pastedImage) {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', pastedImage);

      try {
        const res = await apiClient.post('/teacher/questions/image-to-text', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        // Backend'den dönen veri: { question, choices } veya { text }
        if (res.data && res.data.question && res.data.choices) {
          // Soru kökü ve şıkları metin olarak birleştirip textarea'ya yaz
          let metin = res.data.question + '\n';
          res.data.choices.forEach(c => {
            if (c.label && c.text) metin += `${c.label}) ${c.text}\n`;
          });
          setText(metin.trim());
        } else if (res.data && res.data.text) {
          setText(res.data.text);
        } else {
          setText('');
        }
        // Görseli temizle, kullanıcı metni düzenleyip tekrar dönüştürebilsin
        setPastedImage(null);
        setImagePreview(null);
      } catch (error) {
        console.error(error);
        alert("Resim okunamadı. Lütfen tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    } 
    // 2. DURUM: SADECE METİN VARSA (CLIENT-SIDE REGEX)
    else {
      // (Burada önceki kodunuzdaki parseTextToQuestion mantığını kullanıyoruz)
      const parsed = parseTextLocally(text);
      onConvert(parsed);
      onClose();
    }
  };

  // Yerel Metin Ayrıştırıcı (Regex)
  const parseTextLocally = (inputText) => {
    let questionText = inputText;
    let options = ["", "", "", ""];
    let correctAnswer = "A";

    const optionRegex = /(?:^|\n)\s*([A-D])[\).]\s+(.*?)(?=(?:(?:\n\s*[A-D][\).])|$))/gs;
    let match;
    const foundOptions = [];

    while ((match = optionRegex.exec(inputText)) !== null) {
      const index = "ABCD".indexOf(match[1]);
      if (index > -1) {
        options[index] = match[2].trim();
        foundOptions.push(match[0]);
      }
    }
    foundOptions.forEach(opt => { questionText = questionText.replace(opt, ""); });

    const answerRegex = /(?:Cevap|Yanıt|Doğru Şık)[:\s-]*([A-D])/i;
    const answerMatch = inputText.match(answerRegex);
    if (answerMatch) {
        correctAnswer = answerMatch[1].toUpperCase();
        questionText = questionText.replace(answerMatch[0], "");
    }

    return {
      text: questionText.trim(),
      options,
      correctAnswer,
      difficulty: "Orta",
      subject: "Genel"
    };
  };

  const clearImage = () => {
    setPastedImage(null);
    setImagePreview(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col h-[600px] overflow-hidden">
        
        {/* HEADER */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Clipboard size={20} />
            </div>
            <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Akıllı Yapıştır</h3>
                <p className="text-xs text-slate-500">Metin veya Resim (Ctrl+V) yapıştırın.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 p-6 flex flex-col gap-4 relative">
            
            {/* Yükleniyor Ekranı */}
            {loading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
                    <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                    <p className="text-slate-600 dark:text-slate-300 font-bold">Görsel Analiz Ediliyor...</p>
                    <p className="text-xs text-slate-400">Yapay zeka soruyu okuyor.</p>
                </div>
            )}

            {/* Resim Önizleme Alanı */}
            {imagePreview ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl border-2 border-dashed border-indigo-300 relative group">
                    <img src={imagePreview} alt="Pasted" className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
                    <button 
                        onClick={clearImage}
                        className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-transform hover:scale-110"
                    >
                        <Trash2 size={20} />
                    </button>
                    <div className="absolute bottom-4 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-md">
                        Görsel Algılandı
                    </div>
                </div>
            ) : (
                // Metin Alanı
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onPaste={handlePaste} // Yapıştırma olayını dinliyoruz
                    placeholder={`Buraya bir metin yapıştırın VEYA Ctrl+V ile bir ekran görüntüsü yapıştırın.\n\nÖrnek Metin Formatı:\nSoru metni...\nA) Şık 1\nB) Şık 2\n...\nCevap: A`}
                    className="flex-1 w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono text-sm leading-relaxed"
                />
            )}
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
            <button 
                onClick={onClose}
                className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-colors"
            >
                İptal
            </button>
            <button 
                onClick={handleProcess}
                disabled={(!text.trim() && !pastedImage) || loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {pastedImage ? <ImageIcon size={18} /> : <FileText size={18} />}
                {pastedImage ? 'Görseli Dönüştür' : 'Metni Dönüştür'}
            </button>
        </div>
      </div>
    </div>
  );
}