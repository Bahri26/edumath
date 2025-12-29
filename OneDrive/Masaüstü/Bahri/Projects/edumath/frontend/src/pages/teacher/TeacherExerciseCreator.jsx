import React, { useState, useEffect } from 'react';
import classLevelsAndDifficulties from '../../data/classLevelsAndDifficulties.json';
import {
  Plus, Search, Trash2, Sparkles, Loader2, ChevronLeft, ChevronRight,
  Eye, AlertCircle, Clock, Zap, Target, Layers, Calendar, X
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';

// --- Utility: Zorluk Rengi ---
const getDifficultyColor = (level) => {
  const colors = {
    'Kolay': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    'Orta': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    'Zor': 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  };
  return colors[level] || colors['Orta'];
};

// --- Component: Zorluk Seçim Butonu ---
const DifficultyChip = ({ difficulty, selected, onToggle }) => {
  const isSelected = selected.includes(difficulty);
  const activeClasses = {
    'Kolay': 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-200',
    'Orta': 'bg-amber-500 border-amber-600 text-white shadow-amber-200',
    'Zor': 'bg-rose-500 border-rose-600 text-white shadow-rose-200',
  };

  return (
    <button
      onClick={() => onToggle(difficulty)}
      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200 border-b-4 active:border-b-0 active:translate-y-1 ${
        isSelected
          ? `${activeClasses[difficulty]} shadow-lg`
          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
      }`}
    >
      {difficulty}
    </button>
  );
};

// --- Component: Egzersiz Kartı ---
const ExerciseCard = ({ exercise, onView, onDelete }) => {
  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Dekoratif Arka Plan */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs font-bold mb-2">
              <Layers size={12} /> {exercise.classLevel}
            </span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {exercise.name}
            </h3>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onView(exercise)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
              <Eye size={18} />
            </button>
            <button onClick={() => onDelete(exercise._id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 h-10">
          {exercise.description || 'Açıklama yok.'}
        </p>

        {/* Etiketler */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-md border border-slate-200 dark:border-slate-600">
             {exercise.totalQuestions} Soru
          </span>
          {exercise.difficulty.map(d => (
            <span key={d} className={`px-2.5 py-1 text-xs font-bold rounded-md border ${getDifficultyColor(d)}`}>
              {d}
            </span>
          ))}
          {exercise.gameMode === 'timed' && (
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-md flex items-center gap-1">
              <Clock size={12} /> {exercise.timeLimit} dk
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1">
            <Target size={14} /> {exercise.subject}
          </span>
          <span className="flex items-center gap-1">
             {exercise.submissions?.length || 0} Katılım
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ANA SAYFA
// ============================================

export default function TeacherExerciseCreator() {
  const { showToast } = useToast();

  // State
  const [createMode, setCreateMode] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseDescription, setExerciseDescription] = useState('');
  const [selectedClass, setSelectedClass] = useState(classLevelsAndDifficulties.classLevels[8]);
  const [selectedSubject, setSelectedSubject] = useState('Matematik');
  const [selectedDifficulties, setSelectedDifficulties] = useState(classLevelsAndDifficulties.difficulties.map(d => d.key).slice(0,2));
  const [gameMode, setGameMode] = useState('practice');
  const [timeLimit, setTimeLimit] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // List State
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- YAPIŞTIR MODAL STATE ---
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isPasting, setIsPasting] = useState(false);

  // Fetch
    // --- YAPIŞTIR: Hazır Soru Ekle ---
    const handlePasteQuestions = async () => {
      if (!pasteText.trim()) return showToast('Lütfen soru metni girin', 'error');
      setIsPasting(true);
      try {
        // Örnek endpoint: /questions/bulk veya /exercises/bulk
        // Burada örnek olarak /questions/bulk kullanıldı, backendde yoksa eklenmeli!
        await apiClient.post('/questions/bulk', { text: pasteText });
        showToast('Sorular başarıyla eklendi!', 'success');
        setPasteText('');
        setIsPasteModalOpen(false);
        fetchExercises();
      } catch (err) {
        showToast(err.response?.data?.message || 'Soru eklenemedi', 'error');
      } finally {
        setIsPasting(false);
      }
    };
  const fetchExercises = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 9 };
      if (selectedClass !== 'Tümü') params.classLevel = selectedClass;
      
      const res = await apiClient.get('/exercises/teacher/my-exercises', { params });
      if (res.data.data) {
        setExercises(res.data.data);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      showToast('Egzersizler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [page, selectedClass]);

  // Create Handler
  const handleCreateExercise = async () => {
    if (!exerciseName.trim()) return showToast('Egzersiz adı gerekli', 'error');
    if (selectedDifficulties.length === 0) return showToast('Zorluk seviyesi seçmelisiniz', 'error');

    setIsCreating(true);
    try {
      const payload = {
        name: exerciseName,
        description: exerciseDescription,
        classLevel: selectedClass,
        subject: selectedSubject,
        difficulty: selectedDifficulties,
        gameMode,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        pointsPerQuestion: 10
      };

      await apiClient.post('/exercises', payload);
      showToast('✨ Egzersiz başarıyla oluşturuldu!', 'success');
      
      // Reset
      setExerciseName('');
      setExerciseDescription('');
      setCreateMode(false);
      fetchExercises();
    } catch (err) {
      showToast(err.response?.data?.message || 'Hata oluştu', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Delete Handler
  const handleDeleteExercise = async (id) => {
    if (!window.confirm('Bu egzersizi silmek istediğinizden emin misiniz?')) return;
    try {
      await apiClient.delete(`/exercises/${id}`);
      showToast('Egzersiz silindi', 'success');
      fetchExercises();
    } catch (err) {
      showToast('Silinemedi', 'error');
    }
  };

  const handleToggleDifficulty = (diff) => {
    setSelectedDifficulties(prev => 
      prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 p-6 md:p-10 pb-24">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
            AI Egzersiz Stüdyosu
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl">
            Yapay zeka desteğiyle sınıfınız için saniyeler içinde kişiselleştirilmiş, eğlenceli ve öğretici egzersizler oluşturun.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setCreateMode(true)}
            className="group relative px-6 py-3 rounded-2xl bg-slate-900 dark:bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-300" /> Yeni Egzersiz
            </span>
          </button>
          <button
            onClick={() => setIsPasteModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-slate-700 dark:bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800 transition-all duration-300 flex items-center gap-2"
          >
            <span className="text-lg">📋</span> Yapıştır
          </button>
        </div>
            {/* --- YAPIŞTIR MODAL --- */}
            {isPasteModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 relative">
                  <button
                    onClick={() => setIsPasteModalOpen(false)}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-700/50 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">Hazır Soruları Yapıştır</h2>
                  <textarea
                    rows={8}
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder="Her satıra bir soru gelecek şekilde soruları buraya yapıştırın..."
                    className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-medium mb-4 resize-vertical"
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setIsPasteModalOpen(false)}
                      className="px-5 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                      disabled={isPasting}
                    >İptal
                    </button>
                    <button
                      onClick={handlePasteQuestions}
                      className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50"
                      disabled={isPasting}
                    >
                      {isPasting ? <Loader2 className="animate-spin" size={18} /> : 'Kaydet'}
                    </button>
                  </div>
                </div>
              </div>
            )}
      </div>

      {/* --- CREATE FORM (MODAL / EXPANDABLE) --- */}
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${createMode ? 'max-h-[800px] opacity-100 mb-10' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 relative">
          <button 
            onClick={() => setCreateMode(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-700/50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sol Kolon: Temel Bilgiler */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Egzersiz Başlığı</label>
                <input
                  type="text"
                  placeholder="Örn: 9. Sınıf Matematik - Üslü Sayılar Challenge"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-semibold text-lg"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sınıf Seviyesi</label>
                   <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium appearance-none"
                   >
                      {classLevelsAndDifficulties.classLevels.slice(8, 12).map(cls => <option key={cls} value={cls}>{cls}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ders</label>
                   <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium appearance-none"
                   >
                      {['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya'].map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Açıklama</label>
                <textarea
                  rows="3"
                  placeholder="Öğrencileriniz için kısa bir açıklama..."
                  value={exerciseDescription}
                  onChange={(e) => setExerciseDescription(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium resize-none"
                />
              </div>
            </div>

            {/* Sağ Kolon: Ayarlar */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-6">
              
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                  <Target size={18} className="text-indigo-500" /> Zorluk Seviyesi
                </label>
                <div className="flex flex-wrap gap-2">
                  {classLevelsAndDifficulties.difficulties.map(diff => (
                    <DifficultyChip
                      key={diff.key}
                      difficulty={diff.key}
                      selected={selectedDifficulties}
                      onToggle={handleToggleDifficulty}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                  <Zap size={18} className="text-amber-500" /> Oyun Modu
                </label>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${gameMode === 'practice' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent bg-white dark:bg-slate-800'}`}>
                    <input type="radio" name="mode" value="practice" checked={gameMode === 'practice'} onChange={() => setGameMode('practice')} className="hidden" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${gameMode === 'practice' ? 'border-indigo-500' : 'border-slate-300'}`}>
                      {gameMode === 'practice' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                    </div>
                    <span className="font-medium text-sm">Standart Pratik</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${gameMode === 'timed' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-transparent bg-white dark:bg-slate-800'}`}>
                    <input type="radio" name="mode" value="timed" checked={gameMode === 'timed'} onChange={() => setGameMode('timed')} className="hidden" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${gameMode === 'timed' ? 'border-purple-500' : 'border-slate-300'}`}>
                      {gameMode === 'timed' && <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-sm block">Zamana Karşı</span>
                      {gameMode === 'timed' && (
                        <input 
                          type="number" 
                          placeholder="Dk" 
                          className="mt-1 w-full p-1 bg-white border rounded text-xs" 
                          value={timeLimit || ''}
                          onChange={(e) => setTimeLimit(e.target.value)}
                        />
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <button
                onClick={handleCreateExercise}
                disabled={isCreating}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {isCreating ? 'Oluşturuluyor...' : 'Egzersizi Başlat'}
              </button>

            </div>
          </div>
        </div>
      </div>

      {/* --- FILTERS & LIST --- */}
      <div className="mb-6 flex items-center justify-between">
         <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <button 
               onClick={() => setSelectedClass('Tümü')}
               className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedClass === 'Tümü' ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
               Tümü
            </button>
            {classLevelsAndDifficulties.classLevels.slice(8, 12).map(cls => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedClass === cls ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {cls}
              </button>
            ))}
         </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-400 font-medium">Egzersizleriniz yükleniyor...</p>
        </div>
      ) : exercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 border-dashed">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
             <AlertCircle size={32} className="text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Henüz Egzersiz Yok</h3>
          <p className="text-slate-500 mb-6 text-center max-w-sm">Yapay zeka ile ilk egzersizini oluşturmaya başla.</p>
          <button onClick={() => setCreateMode(true)} className="text-indigo-600 font-bold hover:underline">Yeni Oluştur</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map(ex => (
            <ExerciseCard
              key={ex._id}
              exercise={ex}
              onView={() => {}} 
              onDelete={handleDeleteExercise}
            />
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center mt-12 gap-2">
          <button 
             disabled={page === 1}
             onClick={() => setPage(p => p - 1)}
             className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
             <ChevronLeft size={20} />
          </button>
          <span className="px-4 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-300">
             {page} / {totalPages}
          </span>
          <button 
             disabled={page === totalPages}
             onClick={() => setPage(p => p + 1)}
             className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
             <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}