import React, { useEffect, useState, useRef } from 'react';
import { Clock, FileText, Plus, Trash2, Play, CheckCircle, AlertTriangle, X, Brain, Sparkles, GripVertical } from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { createExam } from '../../services/examService';
import SkeletonCard from '../../components/ui/SkeletonCard';
import { renderWithLatex } from '../../utils/latex.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';

const ExamsPage = ({ role }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- ÖĞRETMEN STATE ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingExam, setCreatingExam] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [duration, setDuration] = useState(25);
  const [selectedClass, setSelectedClass] = useState('9. Sınıf');
  const [examSubject, setExamSubject] = useState('');
  const [formError, setFormError] = useState('');
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [draggedQuestion, setDraggedQuestion] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  const { showToast } = useToast ? useToast() : { showToast: () => {} };

  // --- ÖĞRENCİ STATE ---
  const [activeExam, setActiveExam] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Sonuç ve AI Alıştırma State'leri
  const [examResult, setExamResult] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState(null);
  const [practiceState, setPracticeState] = useState({});
  const [myResult, setMyResult] = useState(null);

  const timerRef = useRef(null);

  const fetchExams = async () => {
    try {
      const endpoint = role === 'student' ? '/exams/by-class' : '/exams';
      const res = await apiClient.get(endpoint);
      setExams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // --- TEACHER: SINAV OLUŞTUR ---
  const handleCreateExam = async () => {
    if (!newTitle || !examSubject) {
      setFormError("Başlık ve Konu alanları zorunludur.");
      return;
    }
    setFormError('');
    setCreatingExam(true);
    try {
      await createExam({
        title: newTitle,
        duration,
        classLevel: selectedClass,
        subject: examSubject
      });
      showToast && showToast(`"${examSubject}" konusunda sınav başarıyla oluşturuldu!`, "success");
      setShowCreateModal(false);
      setNewTitle('');
      setExamSubject('');
      fetchExams();
    } catch (err) {
      setFormError("Hata: " + (err.response?.data?.message || err.message));
      showToast && showToast("Sınav oluşturulamadı.", "error");
    } finally {
      setCreatingExam(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Silmek istediğine emin misin?")) {
      await apiClient.delete(`/exams/${id}`);
      fetchExams();
    }
  };

  // --- STUDENT: SINAV BAŞLAT/BİTİR ---
  const startExam = async (examId) => {
    try {
      const res = await apiClient.get(`/exams/${examId}`);
      const examData = res.data;
      setActiveExam(examData);
      setTimeLeft(examData.duration * 60);
      setUserAnswers({});
      setExamResult(null);
      setPracticeQuestions(null); // Eski alıştırmaları temizle

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishExam(examData._id, {}); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      alert("Sınav başlatılamadı.");
    }
  };

  const finishExam = async () => {
    if (!activeExam) return;
    clearInterval(timerRef.current);
    try {
      const res = await apiClient.post(`/exams/${activeExam._id}/submit`, { answers: userAnswers });
      
      // Backend artık { score, weakTopics } dönüyor
      setExamResult(res.data);
      setActiveExam(null);
      fetchExams();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Sınav gönderilirken hata oluştu.';
      alert(msg);
    }
  };

  // --- STUDENT: KENDİ SONUCUMU GÖR ---
  const viewMyResult = async (examId) => {
    try {
      const res = await apiClient.get(`/exams/${examId}/my-result`);
      setMyResult(res.data);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Sonuç bulunamadı.';
      alert(msg);
    }
  };

  // --- STUDENT: AI İLE ALIŞTIRMA OLUŞTUR ---
  const handleGeneratePractice = async () => {
    if (!examResult?.weakTopics || examResult.weakTopics.length === 0) return;
    
    setLoadingAI(true);
    try {
      // Backend'deki yeni route: /api/ai/practice (Bunu routes dosyasına eklemeyi unutma!)
      const res = await apiClient.post('/ai/practice', { 
        weakTopics: examResult.weakTopics,
        difficulty: 'Orta',
        count: 5
      });
      setPracticeQuestions(res.data.questions);
    } catch (err) {
      console.error(err);
      alert("AI şu an meşgul, lütfen tekrar dene.");
    } finally {
      setLoadingAI(false);
    }
  };

  // Alıştırma Sorusu Cevaplama (Anlık Geri Bildirim)
  const handlePracticeAnswer = (qIndex, optionKey, correctOption) => {
    setPracticeState(prev => ({
      ...prev,
      [qIndex]: {
        selected: optionKey,
        isCorrect: optionKey === correctOption
      }
    }));
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // --- EKRAN 1: SINAV ANI (Öğrenci) ---
  if (activeExam && !examResult) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-slate-900 overflow-y-auto">
        <div className="bg-white dark:bg-slate-800 p-4 shadow-md sticky top-0 z-10 flex justify-between items-center px-8 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold dark:text-white">{activeExam.title}</h2>
            <p className="text-sm text-slate-500">Toplam {activeExam.questions.length} Soru</p>
          </div>
          <div className={`text-2xl font-mono font-bold px-4 py-2 rounded-lg ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>{formatTime(timeLeft)}</div>
          <button onClick={finishExam} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700">Bitir</button>
        </div>
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {activeExam.questions.map((q, idx) => (
            <div key={q._id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex gap-3 mb-4">
                <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-3 py-1 rounded-lg">Soru {idx + 1}</span>
                <span className={`px-2 py-1 rounded text-xs font-bold text-white ${q.difficulty === 'Zor' ? 'bg-red-500' : q.difficulty === 'Orta' ? 'bg-yellow-500' : 'bg-green-500'}`}>{q.difficulty}</span>
              </div>
              <div className="text-lg font-medium text-slate-800 dark:text-white mb-4">
                {renderWithLatex(q.text)}
              </div>
              {q.image && (
                <div className="mb-5 overflow-hidden rounded-[1.5rem] border border-indigo-100 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4 shadow-inner">
                  <img src={q.image} alt="Soru görseli" className="h-72 w-full object-contain rounded-2xl" />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(Array.isArray(q.options) ? q.options : []).map((opt, i) => {
                  const optionText = opt?.text || '';
                  const isSelected = userAnswers[q._id] === optionText;
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <label
                      key={i}
                      className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'}`}
                    >
                      <input
                        type="radio"
                        name={`q-${q._id}`}
                        value={optionText}
                        onChange={() => setUserAnswers({ ...userAnswers, [q._id]: optionText })}
                        className="mt-1 w-5 h-5 text-indigo-600"
                      />
                      <div className="flex-1">
                        <div className="text-slate-700 dark:text-slate-200">
                          <span className="font-bold mr-2">{letter})</span>
                          {renderWithLatex(optionText)}
                        </div>
                        {opt?.image && (
                          <div className="mt-3 inline-flex rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-sm">
                            <img src={opt.image} alt={`Seçenek ${letter} görseli`} className="h-24 w-24 object-contain rounded-xl" />
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- EKRAN 2: SONUÇ VE AI ANTRENMAN ---
  if (examResult) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto pt-6 pb-20 space-y-8">
        
        {/* Sonuç Kartı */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
             {examResult.score >= 50 ? <CheckCircle size={40} /> : <AlertTriangle size={40} className="text-orange-500"/>}
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Sınav Tamamlandı!</h2>
          <p className="text-slate-500 mb-6">Başarı Puanın: <span className={`text-2xl font-bold ${examResult.score >= 50 ? 'text-green-600' : 'text-orange-500'}`}>{examResult.score}</span></p>
          
          {/* Eksik Konular Listesi */}
          {examResult.weakTopics && examResult.weakTopics.length > 0 ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 max-w-lg mx-auto mb-6 text-left">
              <h3 className="font-bold text-red-700 dark:text-red-300 flex items-center gap-2 mb-3">
                <AlertTriangle size={18}/> Geliştirilmesi Gereken Konular:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-red-600 dark:text-red-400">
                {examResult.weakTopics.map((topic, i) => (
                  <li key={i}>{topic}</li>
                ))}
              </ul>
              
              {/* AI Butonu - Sadece sorular henüz üretilmediyse göster */}
              {!practiceQuestions && (
                <button 
                  onClick={handleGeneratePractice} 
                  disabled={loadingAI}
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-200 dark:shadow-none"
                >
                  {loadingAI ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      AI Soruları Hazırlıyor...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      AI İle Eksiklerini Kapat
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-green-600 font-medium mb-6">Tebrikler! Belirgin bir eksik konun yok. 🎉</div>
          )}

          <button onClick={() => setExamResult(null)} className="text-slate-500 hover:text-slate-800 underline">
            Listeye Dön
          </button>
        </div>

        {/* AI Tarafından Üretilen Alıştırma Alanı */}
        {practiceQuestions && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                <Brain size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Sana Özel Antrenman</h3>
                <p className="text-slate-500">Gemini AI tarafından eksiklerine göre hazırlandı.</p>
              </div>
            </div>

            <div className="space-y-6">
              {practiceQuestions.map((q, idx) => {
                const state = practiceState[idx];
                const isAnswered = !!state;

                return (
                  <div key={idx} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 transition-all ${isAnswered ? (state.isCorrect ? 'border-green-200' : 'border-red-200') : 'border-transparent shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-lg text-sm">Soru {idx + 1}</span>
                    </div>
                    
                    {/* Soru Metni (Basit LaTeX desteği için Latex kütüphanesi eklenebilir) */}
                    <p className="text-lg font-medium text-slate-800 dark:text-white mb-6">{q.text || q.questionText}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {/* Seçenekler bazen Array bazen Object gelebilir, kontrol ediyoruz */}
                      {(Array.isArray(q.options) ? q.options : Object.values(q.options)).map((opt, i) => {
                        const optKey = ["A", "B", "C", "D"][i]; // Harf karşılığı
                        const isSelected = state?.selected === (q.options.A ? optKey : opt); // Backend formatına göre kontrol
                        
                        let btnClass = "border-slate-200 hover:bg-slate-50"; // Default
                        if (isAnswered) {
                          if (q.correctAnswer === (q.options.A ? optKey : opt)) btnClass = "bg-green-100 border-green-500 text-green-800"; // Doğru şık
                          else if (isSelected) btnClass = "bg-red-100 border-red-500 text-red-800"; // Yanlış seçim
                          else btnClass = "opacity-50"; // Diğerleri
                        } else if (isSelected) {
                           btnClass = "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50";
                        }

                        return (
                          <button 
                            key={i} 
                            disabled={isAnswered}
                            onClick={() => handlePracticeAnswer(idx, q.options.A ? optKey : opt, q.correctAnswer)}
                            className={`p-4 border rounded-xl text-left transition-all ${btnClass}`}
                          >
                            <span className="font-bold mr-2">{optKey})</span> {opt}
                          </button>
                        )
                      })}
                    </div>

                    {/* Çözüm Açıklaması - Sadece cevaplanınca görünür */}
                    {isAnswered && (
                      <div className={`mt-4 p-4 rounded-xl text-sm ${state.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        <div className="font-bold mb-1 flex items-center gap-2">
                           {state.isCorrect ? <CheckCircle size={16}/> : <X size={16}/>}
                           {state.isCorrect ? "Doğru Cevap!" : "Yanlış Cevap"}
                        </div>
                        <p><strong>Çözüm:</strong> {q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="text-center mt-10">
               <button onClick={() => setExamResult(null)} className="bg-slate-800 text-white px-8 py-3 rounded-xl hover:bg-slate-700">Antrenmanı Bitir</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- EKRAN 3: SINAV LİSTESİ (Ana Ekran) ---
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Sınavlar</h2>
        {role === 'teacher' && (
          <Button variant="primary" size="md" ariaLabel="Sınav Oluştur" onClick={() => setShowCreateModal(true)} icon={Plus}>
            Sınav Oluştur
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {exams.length === 0 ? <div className="col-span-full text-center py-10 text-slate-500">Henüz sınav oluşturulmamış.</div> : exams.map(exam => (
            <Card key={exam._id}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl"><FileText size={24} /></div>
                <div className="flex items-center gap-2">
                  {exam.classLevel && <Badge color="indigo" className="font-semibold">{exam.classLevel}</Badge>}
                  {role === 'teacher' && (
                    <Button aria-label="Sınavı Sil" variant="outline" size="sm" onClick={() => handleDelete(exam._id)}>
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{exam.title}</h3>
              {exam.description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{exam.description}</p>}
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 mb-6">
                <span className="flex items-center gap-1"><Clock size={14}/> {exam.duration} Dk</span>
                <span className="flex items-center gap-1"><AlertTriangle size={14}/> {exam.questions.length} Soru</span>
                {exam.status && <Badge color={exam.status === 'active' ? 'green' : exam.status === 'draft' ? 'yellow' : 'blue'}>{exam.status}</Badge>}
              </div>
              {role === 'student' ? (
                <div className="flex gap-2">
                  <Button variant="primary" size="md" onClick={() => startExam(exam._id)} icon={Play}>Başla</Button>
                  <Button variant="outline" size="md" onClick={() => viewMyResult(exam._id)}>Sonucum</Button>
                </div>
              ) : (
                <div className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl text-center text-sm font-medium">
                  {exam.results.length} Katılım
                </div>
              )}
            </Card>
        ))}
      </div>

      {/* --- MODAL: KENDİ SONUCUM --- */}
      {myResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Sonucum</h3>
              <button onClick={() => setMyResult(null)} className="text-slate-500 hover:text-slate-800">Kapat</button>
            </div>
            <div className="p-6 space-y-3 text-slate-700 dark:text-slate-200">
              <div><span className="font-semibold">Puan:</span> {myResult.score}</div>
              <div>
                <span className="font-semibold">Doğru:</span> {myResult.correctCount} • <span className="font-semibold">Yanlış:</span> {myResult.wrongCount}
              </div>
              {Array.isArray(myResult.weakTopics) && myResult.weakTopics.length > 0 && (
                <div>
                  <div className="font-semibold mb-1">Zayıf Konular</div>
                  <ul className="list-disc list-inside text-sm">
                    {myResult.weakTopics.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: SINAV OLUŞTUR --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">Sınav Oluştur</h3>
              </div>
              <button onClick={() => {setShowCreateModal(false); setActiveTab('create');}} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={24} className="text-white"/>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-3 font-semibold text-sm transition-all ${activeTab === 'create' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white dark:bg-slate-800' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Sınav Oluştur
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`flex-1 py-3 font-semibold text-sm transition-all ${activeTab === 'questions' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white dark:bg-slate-800' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Soru Seçimi ({selectedQuestions.length}/21)
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              {formError && <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium mb-4">{formError}</div>}
              
              {activeTab === 'create' ? (
                <div className="space-y-4">
                  {/* Row 1: Başlık - Full Width */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Sınav Adı *</label>
                    <input 
                      type="text" 
                      className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                      placeholder="Örn: Matematik Denemesi - 1" 
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)}
                    />
                  </div>

                  {/* Row 2: Konu ve Sınıf */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Konu *</label>
                      <input 
                        type="text" 
                        className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                        placeholder="Örn: Örüntüler" 
                        value={examSubject} 
                        onChange={e => setExamSubject(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Sınıf *</label>
                      <select 
                        className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                        value={selectedClass} 
                        onChange={e => setSelectedClass(e.target.value)}
                      >
                        {['1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf', '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', 'Mezun'].map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Süre ve Toplam Soru */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Süre (dakika) *</label>
                      <input 
                        type="number" 
                        className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                        value={duration} 
                        onChange={e => setDuration(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Toplam Soru</label>
                      <div className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-bold flex items-center justify-center">
                        21 Soru
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Açıklama */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Açıklama (İsteğe bağlı)</label>
                    <textarea 
                      className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none" 
                      rows="2"
                      placeholder="Sınav hakkında not ekleyebilirsiniz..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: '1', text: 'Dikildiğinde boyu 20 cm olan bir fidan...', difficulty: 'Kolay', subject: 'Matematik' },
                      { id: '2', text: '24 - 30 - 36 - 40 - 42 - 48...', difficulty: 'Kolay', subject: 'Matematik' },
                      { id: '3', text: 'Verilen örüntüde eksik sayıları bulunuz...', difficulty: 'Kolay', subject: 'Matematik' },
                      { id: '4', text: 'Başlangıçtaki para 40 TL...', difficulty: 'Kolay', subject: 'Matematik' },
                      { id: '5', text: 'Orta Soru 1', difficulty: 'Orta', subject: 'Matematik' },
                      { id: '6', text: 'Orta Soru 2', difficulty: 'Orta', subject: 'Matematik' },
                      { id: '7', text: 'Zor Soru 1', difficulty: 'Zor', subject: 'Matematik' },
                    ].map(q => (
                      <div
                        key={q.id}
                        draggable
                        onDragStart={() => setDraggedQuestion(q)}
                        onClick={() => {
                          if (!selectedQuestions.find(sq => sq.id === q.id)) {
                            setSelectedQuestions([...selectedQuestions, q]);
                          }
                        }}
                        className="p-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-300 dark:border-teal-700 rounded-lg cursor-grab hover:shadow-md active:cursor-grabbing transition-all"
                      >
                        <div className="flex items-start gap-1.5">
                          <GripVertical size={12} className="text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{q.difficulty}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{q.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedQuestions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Seçilen Sorular:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedQuestions.map((q, idx) => (
                          <div key={q.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                            <span>{idx + 1}</span>
                            <button
                              onClick={() => setSelectedQuestions(selectedQuestions.filter(sq => sq.id !== q.id))}
                              className="ml-0.5 hover:text-indigo-900 dark:hover:text-indigo-100"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 flex gap-3">
              <Button 
                variant="outline" 
                size="md"
                className="flex-1"
                onClick={() => {setShowCreateModal(false); setActiveTab('create'); setSelectedQuestions([]);}}
              >
                İptal
              </Button>
              <Button 
                variant="primary" 
                size="md"
                className="flex-1"
                onClick={handleCreateExam}
                disabled={creatingExam || selectedQuestions.length === 0}
              >
                {creatingExam ? '⏳ Oluşturuluyor...' : `✓ Oluştur (${selectedQuestions.length}/21)`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsPage;