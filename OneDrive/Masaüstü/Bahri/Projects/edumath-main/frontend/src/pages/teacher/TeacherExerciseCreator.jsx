import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Trash2, BookOpen, Sparkles, Loader2, ChevronLeft, ChevronRight,
  Eye, AlertCircle, Clock, Zap, GripVertical
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';

// --- Utility ---
const getDifficultyColor = (level) => {
  const colors = {
    'Kolay': 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400',
    'Orta': 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400',
    'Zor': 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/20 dark:text-rose-400',
  };
  return colors[level] || colors['Orta'];
};

// --- Question Filter Card ---
const DifficultyToggle = ({ difficulty, selected, onToggle }) => {
  const bgColor = {
    'Kolay': 'bg-emerald-500',
    'Orta': 'bg-amber-500',
    'Zor': 'bg-rose-500',
  };

  return (
    <button
      onClick={() => onToggle(difficulty)}
      className={`px-4 py-2 rounded-lg font-bold transition-all ${
        selected.includes(difficulty)
          ? `${bgColor[difficulty]} text-white shadow-lg`
          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:shadow'
      }`}
    >
      {difficulty}
    </button>
  );
};

// --- Exercise Card ---
const ExerciseCard = ({ exercise, onView, onDelete }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all flex flex-col justify-between min-h-[140px]">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-lg line-clamp-1">{exercise.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{exercise.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded">
              {exercise.classLevel}
            </span>
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded">
              {exercise.totalQuestions} soru
            </span>
            {exercise.difficulty.map(d => (
              <span key={d} className={`px-2 py-1 text-xs font-bold rounded border ${getDifficultyColor(d)}`}>
                {d}
              </span>
            ))}
            {exercise.gameMode === 'timed' && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold rounded flex items-center gap-1">
                <Clock size={12} /> {exercise.timeLimit} dk
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onView(exercise)}
            className="p-2 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-colors"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => onDelete(exercise._id)}
            className="p-2 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-200 dark:hover:bg-rose-900/40 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        {exercise.submissions?.length || 0} öğrenci başladı
      </div>
    </div>
  );
};

// --- Skeleton Card ---
const ExerciseSkeleton = () => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse min-h-[140px] flex flex-col justify-between">
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1 space-y-2">
        <div className="h-5 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>
    </div>
    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  </div>
);

// ============================================
// ANA COMPONENT
// ============================================

export default function TeacherExerciseCreator() {
  const { showToast } = useToast();

  // ---- Create Form State ----
  const [createMode, setCreateMode] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseDescription, setExerciseDescription] = useState('');
  const [selectedClass, setSelectedClass] = useState('9. Sınıf');
  const [selectedSubject, setSelectedSubject] = useState('Matematik');
  const [selectedDifficulties, setSelectedDifficulties] = useState(['Kolay', 'Orta']);
  const [gameMode, setGameMode] = useState('practice');
  const [timeLimit, setTimeLimit] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // ---- List State ----
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchFilter, setSearchFilter] = useState('Tümü');

  // ---- Fetch Exercises ----
  const fetchExercises = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 8 };
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

  // ---- Create Exercise ----
  const handleCreateExercise = async () => {
    if (!exerciseName.trim()) {
      showToast('Egzersiz adı boş olamaz', 'error');
      return;
    }
    
    if (selectedDifficulties.length === 0) {
      showToast('En az bir zorluk seviyesi seç', 'error');
      return;
    }

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
      showToast('✨ Egzersiz oluşturuldu!', 'success');
      
      // Reset form
      setExerciseName('');
      setExerciseDescription('');
      setSelectedDifficulties(['Kolay', 'Orta']);
      setGameMode('practice');
      setTimeLimit(null);
      setCreateMode(false);
      setPage(1);
      fetchExercises();
    } catch (err) {
      showToast(err.response?.data?.message || 'Egzersiz oluşturulamadı', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // ---- Delete Exercise ----
  const handleDeleteExercise = async (id) => {
    if (window.confirm('Bu egzersizi silmek istediğinizden emin misiniz?')) {
      try {
        await apiClient.delete(`/exercises/${id}`);
        showToast('Egzersiz silindi', 'success');
        fetchExercises();
      } catch (err) {
        showToast('Silinemiyor', 'error');
      }
    }
  };

  const handleToggleDifficulty = (difficulty) => {
    setSelectedDifficulties(prev =>
      prev.includes(difficulty)
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  return (
    <div className="flex-1 p-6 space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:text-white flex items-center gap-3">
            <Sparkles size={32} /> Eğlenceli Egzersizler
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">AI ile sınıfınız için özelleştirilmiş egzersizler oluşturun</p>
        </div>
        <button
          onClick={() => setCreateMode(!createMode)}
          className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
            createMode
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
          }`}
        >
          <Plus size={20} /> {createMode ? 'İptal' : 'Yeni Egzersiz'}
        </button>
      </div>

      {/* CREATE FORM - SPLIT VIEW */}
      {createMode && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: Form Inputs */}
            <div className="flex-1 min-w-[260px] space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white mb-2">
                <Sparkles size={24} className="text-purple-500" /> Yeni Egzersiz Oluştur
              </h2>
              <input
                type="text"
                placeholder="Egzersiz Adı (örn: Sayılar 101 Challenge)"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
              />
              <textarea
                placeholder="Açıklama (isteğe bağlı)"
                value={exerciseDescription}
                onChange={(e) => setExerciseDescription(e.target.value)}
                rows="2"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
                >
                  <option>9. Sınıf</option>
                  <option>10. Sınıf</option>
                  <option>11. Sınıf</option>
                  <option>12. Sınıf</option>
                </select>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
                >
                  <option>Matematik</option>
                  <option>Fizik</option>
                  <option>Kimya</option>
                  <option>Biyoloji</option>
                  <option>Türkçe</option>
                </select>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">📊 Zorluk Seviyeleri (AI otomatik seçer)</p>
                <div className="flex gap-2">
                  {['Kolay', 'Orta', 'Zor'].map(diff => (
                    <DifficultyToggle
                      key={diff}
                      difficulty={diff}
                      selected={selectedDifficulties}
                      onToggle={handleToggleDifficulty}
                    />
                  ))}
                </div>
              </div>
              {/* Visual Game Mode Selector */}
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">🎮 Mod</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setGameMode('practice')}
                    className={`flex-1 flex flex-col items-center justify-center px-4 py-3 rounded-xl border-2 transition-all font-bold gap-1
                      ${gameMode === 'practice' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 shadow' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
                  >
                    <BookOpen size={28} />
                    Pratik
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameMode('challenge')}
                    className={`flex-1 flex flex-col items-center justify-center px-4 py-3 rounded-xl border-2 transition-all font-bold gap-1
                      ${gameMode === 'challenge' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 shadow' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
                  >
                    <Zap size={28} />
                    Challenge
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameMode('timed')}
                    className={`flex-1 flex flex-col items-center justify-center px-4 py-3 rounded-xl border-2 transition-all font-bold gap-1
                      ${gameMode === 'timed' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 shadow' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}
                  >
                    <Clock size={28} />
                    Süreli
                  </button>
                </div>
              </div>
              {gameMode === 'timed' && (
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">⏱️ Süre (dakika)</label>
                  <input
                    type="number"
                    value={timeLimit || ''}
                    onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : null)}
                    min="1"
                    max="120"
                    placeholder="15"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setCreateMode(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateExercise}
                  disabled={isCreating}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    isCreating
                      ? 'bg-indigo-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                  }`}
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Egzersiz Oluştur
                    </>
                  )}
                </button>
              </div>
            </div>
            {/* Right: Live Preview */}
            <div className="flex-1 min-w-[260px] flex flex-col items-center justify-center">
              <div className="w-full max-w-sm bg-gradient-to-br from-indigo-100/80 via-white/80 to-purple-100/80 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-2xl shadow-lg border border-indigo-200 dark:border-indigo-800 p-6 relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-full shadow p-2 border border-slate-200 dark:border-slate-700">
                  <Sparkles size={28} className="text-purple-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center mt-4 mb-2 line-clamp-1">{exerciseName || 'Egzersiz Adı'}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4 min-h-[32px] line-clamp-2">{exerciseDescription || 'Açıklama burada görünecek.'}</p>
                <div className="flex flex-wrap justify-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded">
                    {selectedClass}
                  </span>
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded">
                    {selectedSubject}
                  </span>
                  {selectedDifficulties.map(d => (
                    <span key={d} className={`px-2 py-1 text-xs font-bold rounded border ${getDifficultyColor(d)}`}>{d}</span>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {gameMode === 'practice' && <BookOpen size={20} className="text-indigo-500" />}
                  {gameMode === 'challenge' && <Zap size={20} className="text-amber-500" />}
                  {gameMode === 'timed' && <Clock size={20} className="text-purple-500" />}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {gameMode === 'practice' && 'Pratik'}
                    {gameMode === 'challenge' && 'Challenge'}
                    {gameMode === 'timed' && 'Süreli'}
                  </span>
                  {gameMode === 'timed' && (
                    <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold rounded flex items-center gap-1">
                      <Clock size={12} /> {timeLimit || 15} dk
                    </span>
                  )}
                </div>
                <div className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">Öğrenciler bu egzersizi bu şekilde görecek.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTER */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm font-medium"
        >
          <option value="Tümü">Tüm Sınıflar</option>
          <option>9. Sınıf</option>
          <option>10. Sınıf</option>
          <option>11. Sınıf</option>
          <option>12. Sınıf</option>
        </select>
      </div>

      {/* EXERCISE LIST - TICKET STUB STYLE */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ExerciseSkeleton key={i} />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 font-medium">Henüz egzersiz oluşturmadınız</p>
          <p className="text-slate-400 text-sm mt-1">Yeni bir egzersiz ekleyin ve burada görüntülensin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map(ex => (
            <div key={ex._id} className="relative flex items-center bg-gradient-to-r from-indigo-50/80 via-white/90 to-purple-50/80 dark:from-indigo-900/40 dark:to-purple-900/40 border-l-4 border-indigo-400 dark:border-indigo-600 rounded-xl shadow p-4 pr-8 group overflow-hidden">
              <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex items-center gap-2 mb-1 md:mb-0">
                  <Sparkles size={22} className="text-purple-500" />
                  <span className="font-bold text-slate-800 dark:text-white text-base line-clamp-1">{ex.name}</span>
                </div>
                <span className="hidden md:inline-block text-slate-400 mx-2">|</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{ex.description}</span>
                <span className="hidden md:inline-block text-slate-400 mx-2">|</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <BookOpen size={16} className="text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{ex.classLevel}</span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{ex.totalQuestions} soru</span>
                  {ex.difficulty.map(d => (
                    <span key={d} className={`px-2 py-1 text-xs font-bold rounded border ${getDifficultyColor(d)}`}>{d}</span>
                  ))}
                  {ex.gameMode === 'timed' && (
                    <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold rounded flex items-center gap-1">
                      <Clock size={12} /> {ex.timeLimit} dk
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {}}
                  className="p-2 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-colors"
                  title="Görüntüle"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={() => handleDeleteExercise(ex._id)}
                  className="p-2 bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-200 dark:hover:bg-rose-900/40 transition-colors"
                  title="Sil"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="absolute bottom-0 right-0 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-xs text-slate-500 dark:text-slate-400 rounded-tl-xl rounded-br-xl">
                {ex.submissions?.length || 0} öğrenci başladı
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="p-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="p-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
