import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { X } from 'lucide-react';
import apiClient from '../../services/api';

const CreateExamModal = ({ onClose, onSuccess }) => {

  const [creatingExam, setCreatingExam] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [duration, setDuration] = useState(25);
  const [selectedClass, setSelectedClass] = useState('9. Sınıf');
  const [examSubject, setExamSubject] = useState('');
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  const handleCreateExam = async () => {
    if (!newTitle || !examSubject) {
      setError("Başlık ve Konu alanları zorunludur.");
      return;
    }
    setError('');
    setCreatingExam(true);

    try {
      await apiClient.post('/exams/auto-generate', {
        title: newTitle,
        duration: parseInt(duration),
        classLevel: selectedClass,
        subject: examSubject
      });
      showToast(`"${examSubject}" konusunda sınav başarıyla oluşturuldu!`, "success");
      onSuccess();
    } catch (err) {
      setError("Hata: " + (err.response?.data?.message || err.message));
      showToast("Sınav oluşturulamadı.", "error");
    } finally {
      setCreatingExam(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold dark:text-white">Otomatik Sınav Oluştur</h3>
          <button onClick={onClose} aria-label="Kapat"><X size={24} className="text-slate-400 hover:text-slate-600"/></button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Sınav Başlığı</label>
            <input 
              type="text" 
              className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white" 
              placeholder="Örn: Örüntüler Tarama Testi" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)}
              ref={titleInputRef}
              aria-label="Sınav Başlığı"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Konu (Havuzdan Seçilir)</label>
            <input 
              type="text" 
              className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white" 
              placeholder="Örn: Örüntüler" 
              value={examSubject} 
              onChange={e => setExamSubject(e.target.value)}
              aria-label="Konu"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Süre (Dakika)</label>
            <input 
              type="number" 
              className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white" 
              value={duration} 
              onChange={e => setDuration(e.target.value)}
              aria-label="Süre (Dakika)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Sınıf Seviyesi</label>
            <select 
              className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:text-white" 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)}
              aria-label="Sınıf Seviyesi"
            >
                {['1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf', '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', 'Mezun'].map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                ))}
            </select>
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-sm text-indigo-700 dark:text-indigo-300">
            <p>Havuzdan <b>{selectedClass}</b> ve <b>{examSubject || '...'}</b> konulu:</p>
            <ul className="list-disc pl-5 mt-1 font-bold">
              <li>7 Adet Kolay</li>
              <li>7 Adet Orta</li>
              <li>7 Adet Zor</li>
            </ul>
          </div>
          
          {error && <div className="text-red-500 text-sm">{error}</div>}

              <button 
                onClick={handleCreateExam} 
                disabled={creatingExam}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 mt-2 disabled:bg-indigo-400 flex justify-center items-center gap-2"
                aria-label="Oluştur ve Yayınla"
              >
                {creatingExam ? 'Sorular Seçiliyor...' : 'Oluştur ve Yayınla'}
              </button>
        </div>
      </div>
    </div>
  );
};

export default CreateExamModal;
