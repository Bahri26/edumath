import React, { useEffect, useState } from 'react';
import { 
  Plus, BookOpen, FileText, Trash2, Eye, 
  Clock, Award, Layers, Save, Sparkles, 
  ChevronRight, Calendar, ArrowLeft 
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { CLASS_LEVELS } from '../../data/classLevelsAndDifficulties';
import SkeletonCard from '../../components/ui/SkeletonCard';

// --- Alt Bileşenler (Stüdyo için) ---
const renderWithLatex = (text) => {
  if (!text) return null;
  const parts = String(text).split(/(\$[^$]+\$)/g);
  return (
    <span>
      {parts.map((part, index) => (
        part.startsWith('$') && part.endsWith('$') 
          ? <span key={index} className="text-indigo-600 font-bold mx-1"><InlineMath math={part.slice(1, -1)} /></span>
          : <span key={index}>{part}</span>
      ))}
    </span>
  );
};

const DraggableQuestionCard = ({ question, onDragStart }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, question)}
    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 cursor-grab active:cursor-grabbing hover:shadow-xl transition-all"
  >
    <div className="flex gap-2 mb-2">
      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
        question.difficulty === 'Zor' ? 'bg-rose-50 text-rose-600' : question.difficulty === 'Orta' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
      }`}>
        {question.difficulty}
      </span>
    </div>
    <p className="text-xs font-medium text-slate-700 dark:text-slate-200 line-clamp-2">
      {renderWithLatex(question.text)}
    </p>
  </div>
);

const DropZone = ({ difficulty, questions, onDrop, onRemove, label, colorClass, icon: Icon }) => (
  <div className="space-y-4">
    <div className={`p-4 rounded-[1.5rem] text-white flex items-center justify-between shadow-lg ${colorClass}`}>
      <div className="flex items-center gap-3">
        <Icon size={18} />
        <span className="font-black text-xs uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-xs font-bold">{questions.length}/7</span>
    </div>
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); onDrop(JSON.parse(e.dataTransfer.getData('question'))); }}
      className="rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700 p-4 min-h-[250px] space-y-2 bg-slate-50/50 dark:bg-slate-900/30"
    >
      {questions.map((q, idx) => (
        <div key={q._id} className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 flex items-center gap-2 group">
          <p className="flex-1 text-[10px] font-bold truncate">{renderWithLatex(q.text)}</p>
          <button onClick={() => onRemove(idx)} className="text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={12} /></button>
        </div>
      ))}
    </div>
  </div>
);

// --- Ana Sayfa Bileşeni ---
export default function TeacherExamsPage() {
  const { showToast } = useToast();
  const [view, setView] = useState('list'); // 'list' veya 'studio'
  const [exams, setExams] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stüdyo State'leri
  const [examName, setExamName] = useState('');
  const [classLevel, setClassLevel] = useState('9. Sınıf');
  const [easyQ, setEasyQ] = useState([]);
  const [mediumQ, setMediumQ] = useState([]);
  const [hardQ, setHardQ] = useState([]);

  useEffect(() => {
    fetchExams();
    fetchQuestions();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await apiClient.get('/teacher/my-exams'); // Backend route
      setExams(res.data);
    } catch (err) { showToast('Sınavlar yüklenemedi', 'error'); }
    finally { setLoading(false); }
  };

  const fetchQuestions = async () => {
    try {
      const res = await apiClient.get('/teacher/questions', { params: { limit: 200 } });
      setAllQuestions(res.data.data || []);
    } catch (err) { console.error('Sorular çekilemedi'); }
  };

  const handleCreate = async () => {
    if (easyQ.length !== 7 || mediumQ.length !== 7 || hardQ.length !== 7) {
      return showToast('7-7-7 kuralını tamamlamalısın!', 'error');
    }
    try {
      const payload = { name: examName, classLevel, questions: [...easyQ, ...mediumQ, ...hardQ].map(q => q._id) };
      await apiClient.post('/exams', payload);
      showToast('Sınav yayınlandı!', 'success');
      setView('list');
      fetchExams();
    } catch (err) { showToast('Hata oluştu', 'error'); }
  };

  if (view === 'studio') {
    return (
      <div className="p-6 space-y-8 animate-in slide-in-from-right duration-500">
        <div className="flex justify-between items-center">
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-all">
            <ArrowLeft size={20} /> Listeye Dön
          </button>
          <button onClick={handleCreate} className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-100 flex items-center gap-2 hover:scale-105 transition-all">
            <Save size={20} /> Sınavı Yayınla
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-black px-2">Soru Havuzu</h2>
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {allQuestions.filter(q => q.classLevel === classLevel).map(q => (
                <DraggableQuestionCard key={q._id} question={q} onDragStart={(e) => e.dataTransfer.setData('question', JSON.stringify(q))} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 grid md:grid-cols-3 gap-6">
            <DropZone difficulty="Kolay" label="7 Kolay" questions={easyQ} onDrop={(q) => q.difficulty === 'Kolay' && easyQ.length < 7 && setEasyQ([...easyQ, q])} onRemove={(i) => setEasyQ(easyQ.filter((_, idx) => idx !== i))} colorClass="bg-emerald-500" icon={Award} />
            <DropZone difficulty="Orta" label="7 Orta" questions={mediumQ} onDrop={(q) => q.difficulty === 'Orta' && mediumQ.length < 7 && setMediumQ([...mediumQ, q])} onRemove={(i) => setMediumQ(mediumQ.filter((_, idx) => idx !== i))} colorClass="bg-amber-500" icon={Award} />
            <DropZone difficulty="Zor" label="7 Zor" questions={hardQ} onDrop={(q) => q.difficulty === 'Zor' && hardQ.length < 7 && setHardQ([...hardQ, q])} onRemove={(i) => setHardQ(hardQ.filter((_, idx) => idx !== i))} colorClass="bg-rose-500" icon={Award} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <FileText size={32} className="text-indigo-600" /> Sınav Yönetimi
          </h1>
          <p className="text-slate-500 font-medium mt-1">Toplam {exams.length} sınavın bulunuyor.</p>
        </div>
        <button onClick={() => setView('studio')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-2">
          <Plus size={20} /> Yeni Sınav Oluştur
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam._id} className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><Layers size={24} /></div>
                <div className="flex gap-2">
                   <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Eye size={20}/></button>
                   <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={20}/></button>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{exam.name}</h3>
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(exam.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Clock size={12} /> {exam.duration} DK</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}