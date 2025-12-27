import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, FileText, BookOpen, Loader2, GripVertical, Trash2, 
  Save, AlertCircle, Sparkles, Clock, Calendar, CheckCircle2,
  Filter, Layers, MoreHorizontal, CloudUpload
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import AIQuestionUploadModal from './AIQuestionUploadModal';

// --- MOCK DATA ---
const MOCK_QUESTIONS = [
  { _id: 'm1', subject: 'Matematik', difficulty: 'Kolay', text: 'Bir sayının 3 katının 5 eksiği 10 ise bu sayı kaçtır?', type: 'classical' },
  { _id: 'm2', subject: 'Matematik', difficulty: 'Kolay', text: '$$3x - 12 = 0$$ denkleminin çözüm kümesi nedir?', type: 'multiple' },
  { _id: 'm3', subject: 'Matematik', difficulty: 'Kolay', text: '$$\\frac{2}{3} + \\frac{1}{6}$$ işleminin sonucu kaçtır?', type: 'multiple' },
  { _id: 'm4', subject: 'Matematik', difficulty: 'Orta', text: '$$f(x) = 2x^2 - 3x + 1$$ fonksiyonunun $$x=2$$ noktasındaki türevi nedir?', type: 'multiple' },
  { _id: 'm5', subject: 'Matematik', difficulty: 'Orta', text: 'Logaritma $$log_3(27) + log_2(16)$$ işleminin sonucu kaçtır?', type: 'multiple' },
  { _id: 'm6', subject: 'Fizik', difficulty: 'Orta', text: 'Bir araç 72 km/h sabit hızla 2 saatte kaç km yol alır?', type: 'classical' },
  { _id: 'm7', subject: 'Matematik', difficulty: 'Zor', text: '$$\\int_{0}^{\\pi} \\sin(x) \\cdot \\cos(x) dx$$ integralinin değeri nedir?', type: 'multiple' },
  { _id: 'm8', subject: 'Matematik', difficulty: 'Zor', text: 'Bir ABC üçgeninde $$|AB|=6$$, $$|AC|=8$$ ve $$m(\\widehat{A})=60^\\circ$$ ise $$|BC|$$ kaçtır?', type: 'multiple' },
  { _id: 'm9', subject: 'Kimya', difficulty: 'Zor', text: '0.1 M HCl çözeltisinin pH değeri kaçtır?', type: 'multiple' },
  { _id: 'm10', subject: 'Biyoloji', difficulty: 'Kolay', text: 'DNA sentezi hücre döngüsünün hangi evresinde gerçekleşir?', type: 'multiple' },
];

// --- COMPONENTS ---

const renderWithLatex = (text) => {
  if (!text) return null;
  const stringText = String(text);
  const parts = stringText.split(/(\$[^$]+\$)/g);
  return (
    <span className="pointer-events-none">
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const pureMath = part.slice(1, -1);
          return <span key={index} className="text-indigo-600 font-serif font-medium px-0.5"><InlineMath math={pureMath} /></span>;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

const DraggableQuestionCard = ({ question, onDragStart }) => {
  const getBadgeColor = (level) => {
    switch(level) {
        case 'Kolay': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'Orta': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'Zor': return 'bg-rose-100 text-rose-700 border-rose-200';
        default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 text-slate-300 group-hover:text-indigo-400 transition-colors">
            <GripVertical size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
             <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getBadgeColor(question.difficulty)}`}>
                    {question.difficulty}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{question.subject}</span>
             </div>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-snug">
            {renderWithLatex(question.text)}
          </p>
        </div>
      </div>
    </div>
  );
};

const DropZone = ({ difficulty, questions, onDrop, onRemove, icon: Icon }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const maxQuestions = 7;
  const isFull = questions.length >= maxQuestions;

  const styles = {
    'Kolay': { 
        header: 'text-emerald-700 bg-emerald-50 border-emerald-200', 
        active: 'bg-emerald-50/50 border-emerald-400',
        progress: 'bg-emerald-500'
    },
    'Orta': { 
        header: 'text-amber-700 bg-amber-50 border-amber-200', 
        active: 'bg-amber-50/50 border-amber-400',
        progress: 'bg-amber-500'
    },
    'Zor': { 
        header: 'text-rose-700 bg-rose-50 border-rose-200', 
        active: 'bg-rose-50/50 border-rose-400',
        progress: 'bg-rose-500'
    },
  };
  const theme = styles[difficulty];

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isFull) return;
    try {
      const data = JSON.parse(e.dataTransfer.getData('question'));
      onDrop({ ...data, difficulty });
    } catch (err) {}
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Zone Header */}
      <div className={`p-3 border-b ${theme.header} dark:bg-transparent dark:text-slate-200 dark:border-slate-700 flex justify-between items-center`}>
        <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-white/50 dark:bg-slate-800`}>
                <Icon size={16} />
            </div>
            <span className="font-bold text-sm">{difficulty}</span>
        </div>
        <span className="text-xs font-bold">{questions.length}/{maxQuestions}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 w-full bg-slate-200 dark:bg-slate-700">
         <div 
            className={`h-full transition-all duration-500 ${theme.progress}`} 
            style={{ width: `${(questions.length / maxQuestions) * 100}%` }}
         />
      </div>

      {/* Droppable Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); if(!isFull) setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex-1 overflow-y-auto p-2 space-y-2 transition-all custom-scrollbar ${
            isDragOver ? `${theme.active} border-2 border-dashed` : ''
        }`}
      >
        {questions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-60 min-h-[150px]">
                <Layers size={24} strokeWidth={1.5} />
                <p className="text-xs">Soru sürükleyin</p>
            </div>
        ) : (
            questions.map((q, idx) => (
                <div key={`${q._id}-${idx}`} className="group relative bg-white dark:bg-slate-700 p-2.5 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm text-sm">
                    <div className="flex gap-2">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-600 text-slate-500 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                        </span>
                        <p className="line-clamp-2 text-slate-700 dark:text-slate-200 text-xs leading-relaxed">{renderWithLatex(q.text)}</p>
                    </div>
                    <button 
                        onClick={() => onRemove(idx)}
                        className="absolute top-1 right-1 p-1 text-slate-300 hover:text-rose-500 bg-white dark:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-all"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---

export default function TeacherExamsPage() {
  const { showToast } = useToast();
  
  // Settings State
  const [examName, setExamName] = useState('');
  const [classLevel, setClassLevel] = useState('9. Sınıf');
  const [duration, setDuration] = useState(40);
  
  // Data State
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tümü'); // Tümü, Matematik, Fizik vs.

  const navigate = useNavigate();
  // Baskets
  const [easyQ, setEasyQ] = useState([]);
  const [mediumQ, setMediumQ] = useState([]);
  const [hardQ, setHardQ] = useState([]);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        // Sınıf adını tam metin olarak gönder (örn: '9. Sınıf')
        const res = await apiClient.get('/teacher/questions', { params: { limit: 100, classLevel } });
        if (res.data?.data?.length > 0) setAllQuestions(res.data.data);
        else throw new Error("No data");
      } catch (err) {
        setAllQuestions(MOCK_QUESTIONS);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [classLevel]);

  const filteredQuestions = allQuestions.filter(q => {
    const isSelected = [...easyQ, ...mediumQ, ...hardQ].some(sq => sq._id === q._id);
    if (isSelected) return false;
    if (activeFilter !== 'Tümü' && q.subject !== activeFilter) return false;
    if (searchQuery && !q.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const subjects = ['Tümü', ...new Set(allQuestions.map(q => q.subject))];
  const totalSelected = easyQ.length + mediumQ.length + hardQ.length;
  const isReady = totalSelected === 21 && examName.length > 3;

  return (
    <div className="-m-6 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-900">
      
      {/* 1. TOP BAR (SETTINGS) */}
      <div className="h-16 flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between z-20 shadow-sm">
         <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg">
                <BookOpen size={20} />
                <span className="font-bold hidden md:inline">Sınav Oluşturucu</span>
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
            
            <input 
                value={examName} onChange={e => setExamName(e.target.value)}
                placeholder="Sınav Başlığı (Örn: 9. Sınıf Matematik Final)" 
                className="bg-transparent border-none outline-none font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 w-full max-w-md focus:ring-0"
            />
         </div>

         <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <Clock size={16} className="text-slate-400 ml-2" />
            <input 
              type="number" value={duration} onChange={e => setDuration(e.target.value)}
              className="w-12 bg-transparent border-none text-sm font-bold text-center focus:ring-0 p-0"
            />
            <span className="text-xs text-slate-500 mr-2">dk</span>
          </div>
          <select 
            value={classLevel} onChange={e => setClassLevel(e.target.value)}
            className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 focus:ring-0"
          >
            {Array.from({length: 12}, (_, i) => i + 1).map(c => <option key={c}>{c}. Sınıf</option>)}
          </select>

          {/* --- YENİ EKLENECEK BUTON BURASI --- */}
          <button 
            onClick={() => setAiModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
          >
            <CloudUpload size={18} className="text-purple-600 dark:text-purple-400" />
            <span className="hidden md:inline">PDF Yükle (AI)</span>
          </button>
          {/* ----------------------------------- */}

          <button 
            disabled={!isReady}
            onClick={async () => {
              try {
                const payload = {
                  title: examName,
                  classLevel,
                  duration,
                  questions: [...easyQ, ...mediumQ, ...hardQ].map(q => q._id),
                };
                await apiClient.post('/exams', payload);
                showToast('Sınav Kaydedildi!', 'success');
                navigate('/teacher/my-exams');
              } catch (err) {
                showToast('Sınav kaydedilemedi!', 'error');
              }
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all ${
              isReady 
              ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:shadow-indigo-500/30' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save size={18} />
            <span className="hidden md:inline">Kaydet</span>
          </button>
         </div>
      </div>

      {/* 2. MAIN WORKSPACE (SPLIT VIEW) */}
      <div className="flex-1 flex overflow-hidden">
         
         {/* LEFT: SOURCE (Question Bank) */}
         <div className="w-1/3 min-w-[350px] flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 z-10">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <input 
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Soru havuzunda ara..." 
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {subjects.map(sub => (
                        <button 
                            key={sub}
                            onClick={() => setActiveFilter(sub)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                                activeFilter === sub 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {sub}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" /></div>
                ) : filteredQuestions.length === 0 ? (
                    <div className="text-center text-slate-400 py-10 flex flex-col items-center">
                        <Filter size={32} className="mb-2 opacity-50"/>
                        <p>Soru bulunamadı.</p>
                    </div>
                ) : (
                    filteredQuestions.map(q => (
                        <DraggableQuestionCard 
                            key={q._id} 
                            question={q} 
                            onDragStart={(e) => e.dataTransfer.setData('question', JSON.stringify(q))}
                        />
                    ))
                )}
            </div>
            <div className="p-2 text-center text-xs text-slate-400 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                {filteredQuestions.length} soru listeleniyor
            </div>
         </div>

         {/* RIGHT: TARGET (Exam Paper - Kanban Layout) */}
         <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900">
            {/* Status Bar */}
            <div className="h-12 flex items-center justify-between px-6 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Layers size={16} /> Sınav Taslağı
                </span>
                <div className="flex items-center gap-4 text-xs font-bold">
                    <span className={easyQ.length===7 ? "text-emerald-600":"text-slate-400"}>Kolay: {easyQ.length}/7</span>
                    <span className={mediumQ.length===7 ? "text-amber-600":"text-slate-400"}>Orta: {mediumQ.length}/7</span>
                    <span className={hardQ.length===7 ? "text-rose-600":"text-slate-400"}>Zor: {hardQ.length}/7</span>
                    <div className={`px-2 py-1 rounded ${totalSelected===21 ? 'bg-green-100 text-green-700':'bg-slate-100 text-slate-500'}`}>
                        Toplam: {totalSelected}/21
                    </div>
                </div>
            </div>

            {/* Kanban Columns - No Scroll on Body, Scroll inside Columns */}
            <div className="flex-1 p-4 grid grid-cols-3 gap-4 overflow-hidden h-full">
                <DropZone 
                    difficulty="Kolay" 
                    questions={easyQ} 
                    onDrop={q => setEasyQ(prev => [...prev, q])} 
                    onRemove={idx => setEasyQ(prev => prev.filter((_, i) => i !== idx))}
                    icon={Sparkles}
                />
                <DropZone 
                    difficulty="Orta" 
                    questions={mediumQ} 
                    onDrop={q => setMediumQ(prev => [...prev, q])} 
                    onRemove={idx => setMediumQ(prev => prev.filter((_, i) => i !== idx))}
                    icon={FileText}
                />
                <DropZone 
                    difficulty="Zor" 
                    questions={hardQ} 
                    onDrop={q => setHardQ(prev => [...prev, q])} 
                    onRemove={idx => setHardQ(prev => prev.filter((_, i) => i !== idx))}
                    icon={AlertCircle}
                />
            </div>
         </div>
      </div>

      <AIQuestionUploadModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onQuestionsExtracted={(newQuestions) => {
          setAllQuestions(prev => [...newQuestions, ...prev]);
        }}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}