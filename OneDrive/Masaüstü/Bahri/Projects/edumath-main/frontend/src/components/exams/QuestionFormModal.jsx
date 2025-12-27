import React, { useRef, useEffect, useState } from 'react';
import { X, Plus, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';

// Şık sayısı sınırları (ilkokul: 3, ortaokul: 4, lise/mezun: 5)
function minOptions(classLevel) {
  if (["1. Sınıf", "2. Sınıf", "3. Sınıf", "4. Sınıf"].includes(classLevel)) return 3;
  if (["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf"].includes(classLevel)) return 4;
  return 5;
}
function maxOptions(classLevel) {
  return minOptions(classLevel);
}

const QuestionFormModal = ({ isOpen, onClose, editingId, manualForm, setManualForm, mainImage, setMainImage, onSave, error }) => {
  const firstInputRef = useRef(null);
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  console.log('🔍 QuestionFormModal rendered - isOpen:', isOpen, 'editingId:', editingId, 'manualForm:', manualForm);

  // Ensure manualForm has default structure
  const form = {
    text: manualForm?.text || '',
    subject: manualForm?.subject || 'Matematik',
    classLevel: manualForm?.classLevel || '9. Sınıf',
    difficulty: manualForm?.difficulty || '',
    type: manualForm?.type || 'multiple-choice',
    options: (() => {
      if (manualForm?.options && Array.isArray(manualForm.options) && manualForm.options.length > 0) {
        // If editing, preserve existing options with their text values
        return manualForm.options.map(opt => ({
          text: typeof opt === 'string' ? opt : (opt.text || ''),
          isCorrect: false
        }));
      }
      // New question - 5 empty options
      return [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ];
    })(),
    correctAnswer: manualForm?.correctAnswer || '',
    solution: manualForm?.solution || ''
  };

  useEffect(() => {
    if (isOpen && firstInputRef.current) firstInputRef.current.focus();
  }, [isOpen]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 Form submit - editingId:', editingId);
    console.log('📝 manualForm:', manualForm);
    
    if (!form.text?.trim()) {
      showToast('Soru metni boş olamaz', 'error');
      return;
    }
    
    if (!form.difficulty) {
      showToast('Zorluk seviyesi seçiniz', 'error');
      return;
    }

    if (!form.correctAnswer?.trim()) {
      showToast('Doğru cevap boş olamaz', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('text', form.text);
      formData.append('subject', form.subject || 'Matematik');
      formData.append('classLevel', form.classLevel || '9. Sınıf');
      formData.append('difficulty', form.difficulty);
      formData.append('type', form.type || 'multiple-choice');
      formData.append('correctAnswer', form.correctAnswer);
      formData.append('solution', form.solution || '');

      // Seçenekleri ekle
      if (form.options && Array.isArray(form.options)) {
        form.options.forEach((opt, idx) => {
          formData.append(`options`, opt.text || opt);
        });
      }

      // Resim ekle
      if (mainImage.file) {
        formData.append('image', mainImage.file);
      }

      if (editingId) {
        console.log('🔄 UPDATE - ID:', editingId);
        await apiClient.put(`/questions/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Soru güncellendi!', 'success');
      } else {
        console.log('➕ CREATE - New question');
        await apiClient.post(`/questions`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Soru oluşturuldu!', 'success');
      }

      onSave();
    } catch (err) {
      console.error('Soru kaydetme hatası:', err);
      showToast(err.response?.data?.message || 'Soru kaydedilemedi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    !isOpen ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-scale-in">
      <div 
        className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-modal-title"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-800">
          <div>
            <h3 id="manual-modal-title" className="font-bold text-2xl text-slate-800 dark:text-white">
              {editingId ? '✏️ Soruyu Düzenle' : '➕ Yeni Soru Ekle'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Soru detaylarını doldurun ve kaydedin</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Kapat"
          >
            <X size={28} />
          </button>
        </div>

        {/* Form */}
        <form className="flex-1 overflow-y-auto p-6 space-y-6" onSubmit={handleFormSubmit}>
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-xl text-sm font-medium border border-red-200 dark:border-red-800">
              ⚠️ {error}
            </div>
          )}

          {/* Soru Metni */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              📝 Soru Metni <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              LaTeX formülleri: <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">$...$</code> kullanın
            </p>
            <textarea
              ref={firstInputRef}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={form.text}
              onChange={e => setManualForm({ ...manualForm, ...form, text: e.target.value })}
              placeholder="Örn: $f(x) = x^2$ fonksiyonunun türevi nedir?"
              required
            />
          </div>

          {/* İki Kolon: Görsel ve Sınıf */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Görsel Yükleme */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                🖼️ Görsel (İsteğe bağlı)
              </label>
              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 hover:border-indigo-500 transition-colors">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if(file) setMainImage({ file, preview: URL.createObjectURL(file) });
                  }} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  {mainImage.preview ? (
                    <img src={mainImage.preview} alt="Önizleme" className="h-20 w-20 object-cover rounded border-2 border-indigo-200" />
                  ) : (
                    <>
                      <ImageIcon size={32} className="text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">Dosya seçmek için tıklayın</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Sınıf Seviyesi */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                👥 Sınıf Seviyesi <span className="text-red-500">*</span>
              </label>
              <select
                value={form.classLevel}
                onChange={e => setManualForm({ ...manualForm, ...form, classLevel: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>1. Sınıf</option>
                <option>2. Sınıf</option>
                <option>3. Sınıf</option>
                <option>4. Sınıf</option>
                <option>5. Sınıf</option>
                <option>6. Sınıf</option>
                <option>7. Sınıf</option>
                <option>8. Sınıf</option>
                <option>9. Sınıf</option>
                <option>10. Sınıf</option>
                <option>11. Sınıf</option>
                <option>12. Sınıf</option>
              </select>
            </div>
          </div>

          {/* Zorluk ve Konu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                ⚡ Zorluk Seviyesi <span className="text-red-500">*</span>
              </label>
              <select
                value={form.difficulty}
                onChange={e => setManualForm({ ...manualForm, ...form, difficulty: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Kolay</option>
                <option>Orta</option>
                <option>Zor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                📚 Konu <span className="text-red-500">*</span>
              </label>
              <select
                value={form.subject}
                onChange={e => setManualForm({ ...manualForm, ...form, subject: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Matematik</option>
                <option>Fizik</option>
                <option>Kimya</option>
                <option>Biyoloji</option>
                <option>Türkçe</option>
                <option>Tarih</option>
                <option>Coğrafya</option>
              </select>
            </div>
          </div>

          {/* Şıklar */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
              ✅ Şıklar ({form.options.filter(o => o.text).length}/{minOptions(form.classLevel)})
            </label>
            <div className="space-y-3">
              {form.options.map((opt, i) => (
                <div key={i} className="flex gap-3 items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:shadow-md transition-shadow">
                  {/* Radio Button */}
                  <input 
                    type="radio" 
                    name="correct" 
                    checked={form.correctAnswer === opt.text} 
                    onChange={() => setManualForm({...manualForm, ...form, correctAnswer: opt.text})} 
                    className="w-5 h-5 accent-indigo-600 cursor-pointer"
                  />
                  
                  {/* Şık Harfi */}
                  <span className="w-8 h-8 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 bg-indigo-100 dark:bg-indigo-900 rounded-full text-sm">
                    {String.fromCharCode(65+i)}
                  </span>
                  
                  {/* İnput */}
                  <input 
                    type="text" 
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                    value={opt.text || ''} 
                    onChange={e => {
                      const newOpts = [...form.options];
                      newOpts[i].text = e.target.value;
                      setManualForm({...manualForm, ...form, options: newOpts});
                    }} 
                    placeholder={`Şık ${i + 1} metni...`}
                  />
                  
                  {/* Silme Butonu */}
                  {form.options.length > minOptions(form.classLevel) && (
                    <button 
                      type="button" 
                      onClick={() => {
                        const newOpts = form.options.filter((_, idx) => idx !== i);
                        let newCorrect = form.correctAnswer;
                        if (form.correctAnswer === opt.text) {
                          const firstFilled = newOpts.find(o => o.text && o.text.trim());
                          newCorrect = firstFilled ? firstFilled.text : '';
                        }
                        setManualForm({ ...manualForm, ...form, options: newOpts, correctAnswer: newCorrect });
                      }} 
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg p-2 transition-colors" 
                      title="Şıkkı Sil"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Şık Ekleme Butonu */}
            {form.options.length < maxOptions(form.classLevel) && (
              <button 
                type="button" 
                onClick={() => {
                  setManualForm({
                    ...manualForm,
                    ...form,
                    options: [...form.options, { text: '', image: null, preview: '' }]
                  });
                }} 
                className="mt-4 w-full px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Şık Ekle
              </button>
            )}
          </div>

          {/* Çözüm */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              💡 Çözüm (İsteğe bağlı)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={form.solution || ''}
              onChange={e => setManualForm({ ...manualForm, ...form, solution: e.target.value })}
              placeholder="Sorunun çözümünü açıklayın..."
            />
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end shrink-0 bg-slate-50 dark:bg-slate-700/50 -m-6 -mb-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>💾 {editingId ? 'Güncelle' : 'Kaydet'}</>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
    )
  );
};

export default QuestionFormModal;
