import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, FileText, Trash2, Edit, Eye, Clock, 
  Calendar, Layers, MoreVertical, AlertCircle, Loader2 
} from 'lucide-react';
import classData from '../../data/classLevelsAndDifficulties.json';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ExamPreviewModal from '../../components/modals/ExamPreviewModal';

export default function TeacherExamsList() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // --- States ---
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('Tümü');
  const [previewExam, setPreviewExam] = useState(null);

  // --- Fetch Exams ---
  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/teacher/my-exams');
      if (res.data) setExams(res.data);
    } catch (err) {
      showToast('Sınavlar yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // --- Handlers ---
  const handleDelete = async (id) => {
    if (!window.confirm('Bu sınavı silmek istediğinizden emin misiniz?')) return;
    try {
      await apiClient.delete(`/exams/${id}`);
      setExams(exams.filter(e => e._id !== id));
      showToast('Sınav silindi', 'success');
    } catch (error) {
      showToast('Silinemedi', 'error');
    }
  };

  // --- Filter Logic ---
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'Tümü' || exam.classLevel === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 p-6 md:p-10 pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight flex items-center gap-3">
            <FileText className="text-indigo-600" size={32} /> Sınavlarım
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Oluşturduğunuz tüm sınavları buradan yönetin.
          </p>
        </div>
        <button 
          onClick={() => navigate('/teacher/exams/create')}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
        >
          <Plus size={20} /> Yeni Sınav Oluştur
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Sınav adı ara..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium shadow-sm"
          />
        </div>
        <select 
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-medium shadow-sm cursor-pointer min-w-[150px]"
        >
          <option value="Tümü">Tüm Sınıflar</option>
          {classData.classLevels.map(level => (
             <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
          <p className="text-slate-400 font-medium">Sınavlarınız yükleniyor...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400">
             <Layers size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Sınav Bulunamadı</h3>
          <p className="text-slate-500 mt-2">Henüz bir sınav oluşturmadınız veya aramanızla eşleşen yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map(exam => (
            <div key={exam._id} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 relative overflow-hidden">
              {/* Dekoratif Arka Plan */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

              <div className="relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 flex items-center gap-1">
                    <Layers size={12} /> {exam.classLevel || 'Genel'}
                  </span>
                  {/* Actions Dropdown (Basit versiyon: direkt butonlar) */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 rounded-lg shadow-sm p-1">
                    <button 
                      onClick={() => setPreviewExam(exam)} 
                      title="Önizle"
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 rounded-md transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => navigate(`/teacher/exams/edit/${exam._id}`)}
                      title="Düzenle"
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-amber-600 rounded-md transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(exam._id)} 
                      title="Sil"
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {exam.title}
                </h3>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mb-6">
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded">
                    <Clock size={14} /> {exam.duration} Dk
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded">
                    <AlertCircle size={14} /> {exam.questions?.length || 0} Soru
                  </span>
                </div>
                {/* Footer Info */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {new Date(exam.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                  <span className={exam.isPublished ? 'text-emerald-500 font-bold' : 'text-slate-400 font-bold'}>
                    {exam.isPublished ? 'Yayında' : 'Taslak'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODALS --- */}
      {previewExam && (
        <ExamPreviewModal 
          exam={previewExam} 
          onClose={() => setPreviewExam(null)} 
        />
      )}

    </div>
  );
}
