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
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-lg transition-all">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 dark:text-white mb-2">{exercise.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{exercise.description}</p>
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

      {/* CREATE FORM */}
      {createMode && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">🎮 Mod</label>
              <select
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium"
              >
                <option value="practice">Pratik (Sınırsız)</option>
                <option value="challenge">Challenge (Puanla)</option>
                <option value="timed">Süreli (Zaman limitli)</option>
              </select>
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
          </div>

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

      {/* EXERCISE LIST */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500">Henüz egzersiz oluşturmadınız</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
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
