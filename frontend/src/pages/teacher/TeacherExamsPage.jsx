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
import { useMemo } from 'react';
import { renderWithLatex } from '../../utils/latex.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import ExamPreviewModal from '../../components/exams/ExamPreviewModal.jsx';

// --- Alt Bileşenler (Stüdyo için) ---

const DraggableQuestionCard = ({ question, onDragStart }) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, question)}
    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 cursor-grab active:cursor-grabbing hover:shadow-xl transition-all"
  >
    <div className="flex items-center gap-2 mb-2">
      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
        question.difficulty === 'Zor' ? 'bg-rose-50 text-rose-600' : question.difficulty === 'Orta' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
      }`}>
        {question.difficulty}
      </span>
    </div>
    <div className="flex items-start gap-3">
      <p className="flex-1 text-xs font-medium text-slate-700 dark:text-slate-200 line-clamp-2">
        {renderWithLatex(question.text)}
      </p>
    </div>
  </div>
);

const DropZone = ({ difficulty, questions, onDrop, onRemove, label, colorClass, icon: Icon, availableCount }) => (
  <div className="space-y-4">
    <div className={`p-4 rounded-[1.5rem] text-white flex items-center justify-between shadow-lg ${colorClass}`}>
      <div className="flex items-center gap-3">
        <Icon size={18} />
        <span className="font-black text-xs uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-xs font-bold">{questions.length}/7 • Uygun: {availableCount}</span>
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
  const [profile, setProfile] = useState({ branch: '', branchApproval: 'none' });
  const [view, setView] = useState('list'); // 'list' veya 'studio'
  const [exams, setExams] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState(null);

  // Stüdyo State'leri
  const [examName, setExamName] = useState('');
  const [classLevel, setClassLevel] = useState('9. Sınıf');
  const [easyQ, setEasyQ] = useState([]);
  const [mediumQ, setMediumQ] = useState([]);
  const [hardQ, setHardQ] = useState([]);
  const [poolSubject, setPoolSubject] = useState('Tümü');
  const [poolSearch, setPoolSearch] = useState('');
  const SUBJECTS = ['Tümü', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji'];
  // Zamanlama & Süre
  const [schedStart, setSchedStart] = useState('');
  const [schedEnd, setSchedEnd] = useState('');
  const [durationMin, setDurationMin] = useState(60);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/users/profile');
        const branch = res.data?.branch || '';
        const branchApproval = res.data?.branchApproval || 'none';
        setProfile({ branch, branchApproval });
      } catch {}
    })();
  }, []);

  // Auto-refresh profile while pending approval
  useEffect(() => {
    let timer;
    if (profile.branch && profile.branchApproval === 'pending') {
      timer = setInterval(async () => {
        try {
          const res = await apiClient.get('/users/profile');
          const branch = res.data?.branch || '';
          const branchApproval = res.data?.branchApproval || 'none';
          if (branchApproval === 'approved') {
            setProfile({ branch, branchApproval });
            showToast('Branş onaylandı! Havuz ve sınavlar yenilendi.', 'success');
            // Immediately refresh data with branch scope
            fetchExams();
            fetchQuestions();
            clearInterval(timer);
          }
        } catch {}
      }, 5000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [profile.branch, profile.branchApproval]);

  useEffect(() => {
    fetchExams();
    fetchQuestions();
  }, [profile.branch, profile.branchApproval]);

  const fetchExams = async () => {
    try {
      let res;
      if (profile.branch && profile.branchApproval === 'approved') {
        res = await apiClient.get('/teacher/subject/exams');
      } else {
        res = await apiClient.get('/teacher/my-exams'); // only own exams
      }
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setExams(data);
    } catch (err) { showToast('Sınavlar yüklenemedi', 'error'); }
    finally { setLoading(false); }
  };

  const fetchQuestions = async () => {
    try {
      let res;
      if (profile.branch && profile.branchApproval === 'approved') {
        res = await apiClient.get('/teacher/subject/questions', { params: { limit: 500, classLevel } });
      } else {
        res = await apiClient.get('/teacher/questions', { params: { limit: 200 } });
      }
      setAllQuestions(res.data.data || []);
    } catch (err) { console.error('Sorular çekilemedi'); }
  };

  // Filtrelenmiş havuz soruları
  const poolQuestions = useMemo(() => (
    allQuestions
      .filter(q => q.classLevel === classLevel)
      .filter(q => poolSubject === 'Tümü' || q.subject === poolSubject)
      .filter(q => poolSearch ? (q.text || '').toLowerCase().includes(poolSearch.toLowerCase()) : true)
  ), [allQuestions, classLevel, poolSubject, poolSearch]);

  const availableCounts = useMemo(() => ({
    Kolay: poolQuestions.filter(q => q.difficulty === 'Kolay').length,
    Orta: poolQuestions.filter(q => q.difficulty === 'Orta').length,
    Zor: poolQuestions.filter(q => q.difficulty === 'Zor').length,
  }), [poolQuestions]);

  const existsInAny = (id) => ([...easyQ, ...mediumQ, ...hardQ].some(q => q._id === id));
  const tryAdd = (zoneSetter, zone, q, expectedDiff) => {
    if (q.difficulty !== expectedDiff) return;
    if (existsInAny(q._id)) { showToast('Bu soru zaten eklendi', 'error'); return; }
    if (zone.length >= 7) { showToast('Bu bölüm dolu', 'error'); return; }
    zoneSetter([...zone, q]);
  };

  const handleCreate = async () => {
    if (easyQ.length !== 7 || mediumQ.length !== 7 || hardQ.length !== 7) {
      return showToast('7-7-7 kuralını tamamlamalısın!', 'error');
    }
    try {
      const payload = {
        name: examName,
        classLevel,
        duration: durationMin || 60,
        questions: [...easyQ, ...mediumQ, ...hardQ].map(q => q._id),
        ...(schedStart ? { startAt: schedStart } : {}),
        ...(schedEnd ? { endAt: schedEnd } : {}),
      };
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
          <button onClick={() => {
            const hasUnsaved = easyQ.length + mediumQ.length + hardQ.length > 0;
            if (hasUnsaved && !window.confirm('Stüdyodan çıkmak üzeresin. Eklenmiş sorular kaybolacak, emin misin?')) return;
            setView('list');
          }} className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-all">
            <ArrowLeft size={20} /> Listeye Dön
          </button>
          <button onClick={handleCreate} className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-100 flex items-center gap-2 hover:scale-105 transition-all">
            <Save size={20} /> Sınavı Yayınla
          </button>
        </div>
        {/* Üst Ayarlar: Sınıf ve Havuz filtreleri */}
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-black px-2">Soru Havuzu</h2>
            <div className="flex items-center gap-2 px-2">
              <input
                type="text"
                value={poolSearch}
                onChange={(e) => setPoolSearch(e.target.value)}
                placeholder="Havuzda ara..."
                className="flex-1 p-2 rounded-lg border dark:bg-slate-800 dark:text-white"
              />
              <select
                value={profile.branchApproval === 'approved' ? (profile.branch || 'Tümü') : poolSubject}
                onChange={(e) => setPoolSubject(e.target.value)}
                disabled={profile.branchApproval === 'approved'}
                className="p-2 rounded-lg border text-sm dark:bg-slate-800 dark:text-white"
              >
                {profile.branchApproval === 'approved' 
                  ? [profile.branch || 'Tümü'].map(s => <option key={s} value={s}>{s}</option>)
                  : SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="px-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Sınıf Düzeyi</label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="w-full p-2 rounded-lg border text-sm dark:bg-slate-800 dark:text-white"
              >
                {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Süre (dk)</label>
                  <input type="number" min={10} max={180} value={durationMin} onChange={(e)=>setDurationMin(parseInt(e.target.value||'60'))} className="w-full p-2 rounded-lg border text-sm dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Başlangıç</label>
                  <input type="datetime-local" value={schedStart} onChange={(e)=>setSchedStart(e.target.value)} className="w-full p-2 rounded-lg border text-sm dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Bitiş</label>
                  <input type="datetime-local" value={schedEnd} onChange={(e)=>setSchedEnd(e.target.value)} className="w-full p-2 rounded-lg border text-sm dark:bg-slate-800 dark:text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {poolQuestions.map(q => (
                <DraggableQuestionCard key={q._id} question={q} onDragStart={(e) => e.dataTransfer.setData('question', JSON.stringify(q))} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 grid md:grid-cols-3 gap-6">
            <DropZone difficulty="Kolay" label="7 Kolay" questions={easyQ} availableCount={availableCounts.Kolay} onDrop={(q) => tryAdd(setEasyQ, easyQ, q, 'Kolay')} onRemove={(i) => setEasyQ(easyQ.filter((_, idx) => idx !== i))} colorClass="bg-emerald-500" icon={Award} />
            <DropZone difficulty="Orta" label="7 Orta" questions={mediumQ} availableCount={availableCounts.Orta} onDrop={(q) => tryAdd(setMediumQ, mediumQ, q, 'Orta')} onRemove={(i) => setMediumQ(mediumQ.filter((_, idx) => idx !== i))} colorClass="bg-amber-500" icon={Award} />
            <DropZone difficulty="Zor" label="7 Zor" questions={hardQ} availableCount={availableCounts.Zor} onDrop={(q) => tryAdd(setHardQ, hardQ, q, 'Zor')} onRemove={(i) => setHardQ(hardQ.filter((_, idx) => idx !== i))} colorClass="bg-rose-500" icon={Award} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10 animate-in fade-in duration-500">
      {profile.branchApproval !== 'approved' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700">
          Branş onayı bekleniyor. Onaylanınca branşınızdaki tüm sınav ve soru havuzuna erişebileceksiniz.
        </div>
      )}
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <FileText size={32} className="text-indigo-600" /> Sınav Yönetimi
          </h1>
          <p className="text-slate-500 font-medium mt-1">Toplam {exams.length} sınavın bulunuyor.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 mr-4 text-xs">
            <label className="font-bold text-slate-500">Başlangıç</label>
            <input type="datetime-local" value={schedStart} onChange={(e)=>setSchedStart(e.target.value)} className="border rounded px-2 py-1" />
            <label className="font-bold text-slate-500 ml-2">Bitiş</label>
            <input type="datetime-local" value={schedEnd} onChange={(e)=>setSchedEnd(e.target.value)} className="border rounded px-2 py-1" />
            <label className="font-bold text-slate-500 ml-2">Süre</label>
            <input type="number" min={10} max={180} value={durationMin} onChange={(e)=>setDurationMin(parseInt(e.target.value||'60'))} className="w-20 border rounded px-2 py-1" />
          </div>
          <Button variant="outline" size="md" onClick={async()=>{
            try{
              if (profile.branchApproval !== 'approved') {
                showToast('Branş onayı sonrası hızlı sınav kullanılabilir.', 'warning');
                return;
              }
              const title = `Hızlı Sınav • ${profile.branch || 'Konu'} • ${classLevel}`;
              await apiClient.post('/exams/auto-generate', {
                title,
                duration: durationMin || 25,
                classLevel,
                subject: profile.branch || 'Matematik',
                ...(schedStart ? { startAt: schedStart } : {}),
                ...(schedEnd ? { endAt: schedEnd } : {})
              });
              showToast('Hızlı sınav oluşturuldu!', 'success');
              fetchExams();
            }catch(e){
              const msg = e?.response?.data?.message || 'Hızlı sınav oluşturulamadı';
              showToast(msg, 'error');
            }
          }}>
            <Sparkles size={18}/> Hızlı Sınav
          </Button>
          <Button variant="primary" size="md" onClick={() => setView('studio')}>
            <Plus size={20} /> Yeni Sınav Oluştur
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-300">
              Henüz sınav yok. Hızlı Sınav ile otomatik oluşturabilir veya Yeni Sınav Oluştur ile 7-7-7 stüdyosunu kullanabilirsin.
            </div>
          )}
          {exams.map((exam) => (
            <Card key={exam._id} className="p-6 rounded-[2rem]">
              <div className="flex justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl"><Layers size={24} /></div>
                <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={() => setPreviewId(exam._id)}>
                     <Eye size={16} />
                   </Button>
                   <button
                     onClick={async () => {
                       if (!window.confirm('Bu sınavı silmek istiyor musun?')) return;
                       const prev = exams;
                       // İyimser silme
                       setExams(prev.filter(e => e._id !== exam._id));
                       try {
                         await apiClient.delete(`/exams/${exam._id}`);
                         showToast('Sınav silindi', 'success');
                       } catch (err) {
                         setExams(prev);
                         showToast('Sınav silinemedi', 'error');
                       }
                     }}
                     className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                   ><Trash2 size={20}/></button>
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">{exam.title || exam.name}</h3>
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(exam.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Clock size={12} />
                  <input
                    type="number"
                    min={10}
                    max={180}
                    defaultValue={exam.duration || 60}
                    onBlur={async (e) => {
                      const val = parseInt(e.target.value || '60');
                      if (val === exam.duration) return;
                      const prev = exams;
                      // iyimser güncelleme
                      setExams(prev.map(x => x._id === exam._id ? { ...x, duration: val } : x));
                      try {
                        await apiClient.put(`/exams/${exam._id}`, { duration: val });
                        showToast('Süre güncellendi', 'success');
                      } catch (err) {
                        setExams(prev);
                        showToast('Süre güncellenemedi', 'error');
                      }
                    }}
                    className="ml-1 w-16 p-1 rounded bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-200"
                  /> DK
                </span>
                <span className={`px-2 py-0.5 rounded ${exam.status === 'active' ? 'bg-green-600 text-white' : exam.status === 'draft' ? 'bg-amber-500 text-white' : 'bg-slate-500 text-white'}`}>{exam.status}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      {previewId && (
        <ExamPreviewModal examId={previewId} onClose={() => setPreviewId(null)} />
      )}
    </div>
  );
}