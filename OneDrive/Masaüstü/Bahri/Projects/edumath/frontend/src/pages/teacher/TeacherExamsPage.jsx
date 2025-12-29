import React, { useEffect, useState, useContext } from 'react';
import { 
  Search, FileText, BookOpen, Loader2, GripVertical, Trash2, 
  Clock, Save, Filter, GraduationCap, Layout, AlertCircle, 
  CheckCircle2, Plus, Sparkles, ClipboardList
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

// JSON Verisi (Dosya yolunuza göre güncelleyin)
import classData from '../../data/classLevelsAndDifficulties.json';

// Modallar (Dosya yollarını projenize göre güncelleyin)
import AIGenerateModal from '../../components/modals/AIGenerateModal';
import SmartPasteModal from '../../components/modals/SmartPasteModal';

// --- Utility Functions ---
const renderWithLatex = (text) => {
  if (!text) return null;
  const stringText = String(text);
  const parts = stringText.split(/(\$[^$]+\$)/g);
  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const pureMath = part.slice(1, -1);
          return <span key={index} className="text-indigo-600 font-serif font-bold mx-1"><InlineMath math={pureMath} /></span>;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

// --- Draggable Source Card (Sol Taraf) ---
const DraggableQuestionCard = ({ question, onDragStart }) => {
  const difficultyColor = {
    'Kolay': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Orta': 'bg-amber-100 text-amber-700 border-amber-200',
    'Zor': 'bg-rose-100 text-rose-700 border-rose-200',
  }[question.difficulty] || 'bg-slate-100 text-slate-700';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, question)}
      className="group bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md cursor-grab active:cursor-grabbing transition-all relative select-none"
    >
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-slate-400">
        <GripVertical size={16} />
      </div>
      <div className="flex gap-2 items-center mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${difficultyColor}`}>
          {question.difficulty}
        </span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          {question.subject}
        </span>
      </div>
      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 font-medium leading-relaxed">
        {renderWithLatex(question.text)}
      </p>
    </div>
  );
};

// --- Drop Zone Item (Sağ Taraf) ---
const SelectedQuestionItem = ({ question, index, onRemove }) => {
  return (
    <div className="flex gap-3 items-start p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 group hover:border-rose-200 dark:hover:border-rose-900 transition-colors">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs font-bold flex items-center justify-center mt-0.5">
        {index}
      </div>
      <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${
               question.difficulty === 'Kolay' ? 'bg-emerald-500' : 
               question.difficulty === 'Orta' ? 'bg-amber-500' : 'bg-rose-500'
            }`} />
            <p className="text-xs text-slate-400 font-medium">{question.subject}</p>
         </div>
        <div className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2">
          {renderWithLatex(question.text)}
        </div>
      </div>
      <button 
        onClick={onRemove}
        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

// --- Compact Drop Zone ---
const DropZoneSection = ({ title, questions, difficulty, onDrop, onRemove, colorClass, icon: Icon }) => {
  const [isOver, setIsOver] = useState(false);
  const requiredCount = 7;
  const currentCount = questions.length;
  const isComplete = currentCount === requiredCount;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsOver(true);
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const data = JSON.parse(e.dataTransfer.getData('question'));
        if(currentCount < requiredCount) onDrop({...data, difficulty});
      }}
      className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden flex flex-col h-full ${
        isOver 
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]' 
          : isComplete 
            ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-900/10'
            : 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center ${
         isComplete ? 'bg-emerald-50/50 dark:bg-emerald-900/20' : 'bg-white dark:bg-slate-900'
      }`}>
         <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${colorClass} text-white`}>
               <Icon size={14} />
            </div>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">{title}</h3>
         </div>
         <div className={`px-2 py-0.5 rounded text-xs font-bold ${
            isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
         }`}>
            {currentCount} / {requiredCount}
         </div>
      </div>

      {/* List */}
      <div className="p-2 overflow-y-auto flex-1 space-y-2 min-h-[100px]">
         {questions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-4 opacity-60">
               <Layout size={24} className="mb-2" />
               <p className="text-xs font-medium">Soru sürükleyin</p>
            </div>
         ) : (
            questions.map((q, idx) => (
               <SelectedQuestionItem 
                  key={`${q._id}-${idx}`} 
                  question={q} 
                  index={idx + 1}
                  onRemove={() => onRemove(idx)}
               />
            ))
         )}
      </div>
    </div>
  );
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function TeacherExamsPage() {
  const { showToast } = useToast();
  const { user } = useContext(AuthContext);

  // --- States ---
  const [loading, setLoading] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  
  // Sınav Ayarları
  const [examName, setExamName] = useState('');
  // Sınıf seviyesini JSON'dan gelen ilk değerle başlatıyoruz
  const [classLevel, setClassLevel] = useState(classData.classLevels[0]); 
  const [duration, setDuration] = useState(40);
  
  // Filtreler
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Matematik');

  // Seçilen Sorular
  const [easyQ, setEasyQ] = useState([]);
  const [mediumQ, setMediumQ] = useState([]);
  const [hardQ, setHardQ] = useState([]);

  // Modals
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSmartPasteOpen, setIsSmartPasteOpen] = useState(false);

  // --- Veri Çekme ---
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/teacher/questions', { params: { limit: 500 } });
        if (res.data.data) setAllQuestions(res.data.data);
      } catch (err) {
        showToast('Soru bankası yüklenemedi', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, []);

  // --- AI veya Smart Paste ile eklenen soruları işleme ---
  const handleExternalQuestionAdd = async (newQuestions) => {
      const questionsToAdd = Array.isArray(newQuestions) ? newQuestions : [newQuestions];
      
      const unsavedQuestions = questionsToAdd.filter(q => !q._id || q._id.toString().startsWith('temp'));
      
      if (unsavedQuestions.length > 0) {
          try {
              const res = await apiClient.post('/teacher/questions/bulk', { questions: unsavedQuestions });
              const savedQuestions = res.data.data || res.data;
              setAllQuestions(prev => [...savedQuestions, ...prev]);
              showToast(`${savedQuestions.length} yeni soru eklendi!`, 'success');
          } catch (e) {
              showToast('Sorular kaydedilemedi', 'error');
          }
      } else {
          setAllQuestions(prev => [...questionsToAdd, ...prev]);
      }
  };

  // --- Filtreleme Mantığı ---
  const filteredQuestions = allQuestions.filter(q => {
     const isSelected = [...easyQ, ...mediumQ, ...hardQ].some(sel => sel._id === q._id);
     if (isSelected) return false;

     if (q.classLevel && q.classLevel !== classLevel) return false; 
     if (selectedSubject !== 'Tümü' && q.subject !== selectedSubject) return false;
     if (searchQuery && !q.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
     
     return true;
  });

  // --- Handlers ---
  const handleDragStart = (e, question) => {
    e.dataTransfer.setData('question', JSON.stringify(question));
  };

  const handleCreate = async () => {
    if (!examName.trim()) return showToast('Lütfen sınav adı giriniz', 'error');
    
    const totalCount = easyQ.length + mediumQ.length + hardQ.length;
    if (totalCount !== 21) {
        return showToast(`Toplam 21 soru olmalı (Şu an: ${totalCount})`, 'error');
    }
    
      try {
         const payload = {
            name: examName,
            classLevel,
            duration,
            questions: [...easyQ, ...mediumQ, ...hardQ].map(q => q._id),
            teacherId: user?._id
         };
      
         await apiClient.post('/exams', payload);
         showToast('🎉 Sınav başarıyla oluşturuldu!', 'success');
      
         // Reset
         setEasyQ([]); setMediumQ([]); setHardQ([]); setExamName('');
      } catch (err) {
         showToast(err.response?.data?.message || 'Sınav oluşturulamadı', 'error');
      }
  };

  const totalSelected = easyQ.length + mediumQ.length + hardQ.length;
  const isReady = easyQ.length === 7 && mediumQ.length === 7 && hardQ.length === 7;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-slate-900">
      
      {/* --- SOL PANEL: AYARLAR & SORU BANKASI --- */}
      <div className="w-full md:w-4/12 lg:w-3/12 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-20">
         
         {/* 1. Üst Başlık */}
         <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
               <BookOpen className="text-indigo-600" size={24} /> Sınav Stüdyosu
            </h1>
            <p className="text-xs text-slate-500 mt-1">Sınıfı seç, soruları sürükle ve sınavı oluştur.</p>
         </div>

         {/* 2. Sınav Ayarları (Compact Form) */}
         <div className="p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <div>
               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Sınav Adı</label>
               <input 
                  type="text" 
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="Örn: 9. Sınıf Matematik Tarama"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
               />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Sınıf</label>
                  <select 
                     value={classLevel}
                     onChange={(e) => setClassLevel(e.target.value)}
                     className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none cursor-pointer"
                  >
                     {/* JSON'dan gelen sınıf seviyeleri */}
                     {classData.classLevels.map((level, index) => (
                        <option key={index} value={level}>{level}</option>
                     ))}
                  </select>
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Süre (Dk)</label>
                  <div className="relative">
                     <Clock size={14} className="absolute left-3 top-2.5 text-slate-400" />
                     <input 
                        type="number" 
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none"
                     />
                  </div>
               </div>
            </div>
         </div>

         {/* 3. Soru Filtreleri ve AI Butonları */}
         <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 space-y-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Soru ara..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-medium outline-none"
                />
                </div>
                <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-2 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold outline-none border-none cursor-pointer max-w-[100px]"
                >
                <option value="Tümü">Tüm Ders</option>
                <option>Matematik</option>
                <option>Fizik</option>
                <option>Kimya</option>
                <option>Biyoloji</option>
                <option>Türkçe</option>
                </select>
            </div>
            
            {/* Hızlı Ekleme Butonları */}
            <div className="grid grid-cols-2 gap-2 pt-1">
                <button 
                    onClick={() => setIsAIModalOpen(true)}
                    className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                    <Sparkles size={14} /> AI ile Üret
                </button>
                <button 
                    onClick={() => setIsSmartPasteOpen(true)}
                    className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                    <ClipboardList size={14} /> Metinden Ekle
                </button>
            </div>
         </div>

         {/* 4. Soru Bankası Listesi (Scrollable) */}
         <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-slate-900/30 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            <div className="flex justify-between items-center mb-2 px-1">
               <span className="text-xs font-bold text-slate-500">KAYNAK SORULAR</span>
               <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                  {filteredQuestions.length}
               </span>
            </div>
            
            {loading ? (
               <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500" /></div>
            ) : filteredQuestions.length === 0 ? (
               <div className="text-center py-10 text-slate-400 text-sm">
                  <Filter className="mx-auto mb-2 opacity-50" />
                  Bu kriterde soru bulunamadı.
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-3 pb-10">
                  {filteredQuestions.map(q => (
                     <DraggableQuestionCard key={q._id} question={q} onDragStart={handleDragStart} />
                  ))}
               </div>
            )}
         </div>
      </div>

      {/* --- SAĞ PANEL: SINAV KAĞIDI (DROP ZONES) --- */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
         
         {/* Üst Bilgi Barı */}
         <div className="px-6 py-4 flex justify-between items-center bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 h-20">
            <div>
               <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText className="text-indigo-500" /> Sınav Taslağı
               </h2>
               <div className="flex gap-4 mt-1 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1"><GraduationCap size={14}/> {classLevel}</span>
                  <span className="flex items-center gap-1"><Clock size={14}/> {duration} Dk</span>
                  <span className="flex items-center gap-1"><AlertCircle size={14}/> Toplam 21 Soru</span>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Durum</p>
                  <p className={`text-xl font-black ${isReady ? 'text-emerald-500' : 'text-slate-400'}`}>
                     {totalSelected} / 21
                  </p>
               </div>
               <button 
                  onClick={handleCreate}
                  disabled={!isReady || !examName}
                  className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                     isReady && examName 
                     ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/30' 
                     : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
               >
                  {isReady ? <CheckCircle2 size={20} /> : <Save size={20} />}
                  {isReady ? 'Sınavı Yayınla' : 'Tamamlanmadı'}
               </button>
            </div>
         </div>

         {/* Drop Zones (Scrollable Grid) */}
         <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="grid grid-rows-3 h-full gap-4 min-h-[600px]">
                <DropZoneSection 
                   title="KOLAY BÖLÜM (7 Soru)" 
                   questions={easyQ} 
                   difficulty="Kolay"
                   onDrop={(q) => setEasyQ(prev => [...prev, q])}
                   onRemove={(i) => setEasyQ(prev => prev.filter((_, idx) => idx !== i))}
                   colorClass="bg-emerald-500"
                   icon={CheckCircle2}
                />

                <DropZoneSection 
                   title="ORTA BÖLÜM (7 Soru)" 
                   questions={mediumQ} 
                   difficulty="Orta"
                   onDrop={(q) => setMediumQ(prev => [...prev, q])}
                   onRemove={(i) => setMediumQ(prev => prev.filter((_, idx) => idx !== i))}
                   colorClass="bg-amber-500"
                   icon={Layout}
                />

                <DropZoneSection 
                   title="ZOR BÖLÜM (7 Soru)" 
                   questions={hardQ} 
                   difficulty="Zor"
                   onDrop={(q) => setHardQ(prev => [...prev, q])}
                   onRemove={(i) => setHardQ(prev => prev.filter((_, idx) => idx !== i))}
                   colorClass="bg-rose-500"
                   icon={AlertCircle}
                />
            </div>
         </div>
      </div>

      {/* --- MODALS --- */}
      <AIGenerateModal 
         isOpen={isAIModalOpen} 
         onClose={() => setIsAIModalOpen(false)}
         onAddQuestions={handleExternalQuestionAdd}
         classLevel={classLevel}
      />

      <SmartPasteModal 
         isOpen={isSmartPasteOpen}
         onClose={() => setIsSmartPasteOpen(false)}
         onConvert={handleExternalQuestionAdd}
      />

    </div>
  );
}