import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, FileText, Send, CheckCircle, X, Circle, Dot } from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import SkeletonCard from '../../components/ui/SkeletonCard';
import { useSearchParams } from 'react-router-dom';

const SurveysPage = ({ role }) => {
  const { showToast } = useToast();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
    // Öğretmen filtreleri
    const [statusFilter, setStatusFilter] = useState('Tümü');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchParams, setSearchParams] = useSearchParams();
  
  // --- ÖĞRETMEN STATE'LERİ ---
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  // Birden fazla soru için
  const [questions, setQuestions] = useState([
    { id: 1, text: '', type: 'text', options: ['', ''] }
  ]);
  const [nextQuestionId, setNextQuestionId] = useState(2);
  // Ref for form submit
  const formRef = useRef(null);

  // --- ÖĞRENCİ STATE'LERİ ---
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [answers, setAnswers] = useState({});

  // Verileri Çek
  const fetchSurveys = async () => {
    try {
      const res = await apiClient.get('/surveys');
      setSurveys(res.data);
    } catch (error) {
      showToast('Anketler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'teacher') {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'Tümü') params.status = statusFilter;
      params.page = page;
      params.limit = 9;
      apiClient.get('/teacher/surveys', { params })
        .then(res => {
          const payload = res.data?.data ? res.data : { data: res.data, total: res.data.length, pages: 1, currentPage: 1 };
          setSurveys(payload.data || []);
          setTotal(payload.total || 0);
          setPages(payload.pages || 1);
        })
        .catch(() => showToast('Anketler yüklenemedi', 'error'))
        .finally(() => setLoading(false));
    } else {
      fetchSurveys();
    }
  }, [role, statusFilter, page]);

  // URL senkronizasyonu (öğretmen)
  useEffect(() => {
    if (role !== 'teacher') return;
    const s = searchParams.get('status') || 'Tümü';
    const p = parseInt(searchParams.get('page') || '1');
    setStatusFilter(s);
    setPage(Number.isNaN(p) ? 1 : p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (role !== 'teacher') return;
    const params = {};
    if (statusFilter !== 'Tümü') params.status = statusFilter;
    if (page !== 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [role, statusFilter, page, setSearchParams]);

  // --- ÖĞRETMEN: SORU YÖNETİMİ ---
  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const updateQuestionOption = (qId, optIndex, value) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOptions = [...q.options];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const addOptionToQuestion = (qId) => {
    setQuestions(questions.map(q => 
      q.id === qId ? { ...q, options: [...q.options, ''] } : q
    ));
  };

  const removeOptionFromQuestion = (qId, optIndex) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return { ...q, options: q.options.filter((_, i) => i !== optIndex) };
      }
      return q;
    }));
  };

  const addQuestion = () => {
    setQuestions([...questions, { 
      id: nextQuestionId, 
      text: '', 
      type: 'text', 
      options: ['', ''] 
    }]);
    setNextQuestionId(nextQuestionId + 1);
  };

  const removeQuestion = (id) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const handleCreate = async (e) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) {
      showToast('Başlık zorunludur', 'error');
      return;
    }
    // Tüm soruların dolu olduğunu kontrol et
    if (questions.some(q => !q.text.trim())) {
      showToast('Tüm soru metinlerini doldurunuz', 'error');
      return;
    }
    // Çoktan seçmeli sorular için şıkları kontrol et
    for (let q of questions) {
      if (q.type === 'multiple-choice') {
        const validOptions = q.options.filter(opt => opt.trim() !== '');
        if (validOptions.length < 2) {
          showToast(`"${q.text}" sorusu için en az 2 geçerli şık girmelisiniz`, 'error');
          return;
        }
      }
    }
    try {
      const payload = {
        title: newTitle,
        questions: questions.map(q => ({
          questionText: q.text,
          type: q.type,
          options: q.type === 'multiple-choice' ? q.options.filter(o => o.trim() !== '') : []
        }))
      };
      const { data: created } = await apiClient.post('/surveys', payload);
      setSurveys(prev => [created, ...prev]);
      setShowForm(false);
      setNewTitle('');
      setQuestions([{ id: 1, text: '', type: 'text', options: ['', ''] }]);
      setNextQuestionId(2);
      showToast('Anket yayınlandı', 'success');
    } catch (err) {
      if (err?.response?.status === 401) {
        showToast('Oturum süreniz doldu, lütfen tekrar giriş yapın.', 'error');
      } else {
        showToast('Anket oluşturulamadı: ' + (err?.response?.data?.message || 'Bilinmeyen hata'), 'error');
      }
    }
  };

  // Otomatik demo anket oluşturucu (örnek)
  const autoPublishDemoSurvey = () => {
    setShowForm(true);
    setNewTitle('Otomatik Test Anketi');
    setQuestions([
      { id: 1, text: 'En sevdiğiniz renk?', type: 'multiple-choice', options: ['Kırmızı', 'Mavi', 'Yeşil'] },
      { id: 2, text: 'Günde kaç saat ders çalışıyorsunuz?', type: 'text', options: [''] }
    ]);
    setNextQuestionId(3);
    setTimeout(() => {
      if (formRef.current) formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 500);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu anketi silmek istediğinize emin misiniz?')) {
      const prev = surveys;
      // Optimistic removal
      setSurveys(prev.filter(s => s._id !== id));
      try {
        await apiClient.delete(`/surveys/${id}`);
        showToast('Anket silindi', 'success');
      } catch (err) {
        // Rollback on failure
        setSurveys(prev);
        showToast('Anket silinemedi', 'error');
      }
    }
  };

  // --- ÖĞRENCİ: CEVAPLAMA İŞLEMLERİ ---
  const handleSubmitResponse = async (surveyId) => {
    try {
      const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
        questionId: qId,
        answer: val
      }));
      
      await apiClient.post(`/surveys/${surveyId}/respond`, {
        answers: formattedAnswers
      });
      showToast('Cevabınız başarıyla gönderildi', 'success');
      setActiveSurvey(null);
      setAnswers({});
      fetchSurveys();
    } catch (err) {
      showToast('Gönderim hatası oluştu', 'error');
    }
  };

  if (loading) return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* BAŞLIK */}
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Anketler</h2>
           <p className="text-slate-500 text-sm">
             {role === 'teacher' ? 'Öğrenciler için anket veya oylama oluştur.' : 'Aktif anketlere katıl.'}
           </p>
        </div>
        {role === 'teacher' && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18}/> {showForm ? 'İptal' : 'Yeni Anket'}
          </button>
        )}
      </div>

      {/* --- ÖĞRETMEN: ANKET OLUŞTURMA FORMU --- */}
      {role === 'teacher' && showForm && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-indigo-100 dark:border-slate-700 shadow-sm animate-fade-in">
          <h3 className="font-bold mb-4 dark:text-white text-lg">Hızlı Anket Oluştur</h3>
          
          <form ref={formRef} onSubmit={handleCreate} className="space-y-6">
                  {/* Otomatik demo anket yayınla butonu (geliştirici/test için) */}
                  {role === 'teacher' && !showForm && (
                    <button
                      onClick={autoPublishDemoSurvey}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg ml-4 hover:bg-green-700 transition-colors"
                    >
                      Otomatik Demo Anket Yayınla
                    </button>
                  )}
            {/* Başlık */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Anket Başlığı</label>
              <input 
                type="text" placeholder="Örn: Hafta sonu etüt saati?"
                value={newTitle} onChange={e => setNewTitle(e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Sorular */}
            <div className="space-y-6 border-t border-slate-200 dark:border-slate-600 pt-6">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300">Sorular ({questions.length})</h4>
              
              {questions.map((question, qIdx) => (
                <div key={question.id} className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-lg border border-slate-200 dark:border-slate-600 space-y-3">
                  {/* Soru numarası ve silme butonu */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Soru {qIdx + 1}</span>
                    {questions.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
                      >
                        <Trash2 size={16} /> Soru Sil
                      </button>
                    )}
                  </div>

                  {/* Soru Metni */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Soru Metni</label>
                    <textarea 
                      placeholder="Örn: Hangi saat sizin için daha uygun?"
                      value={question.text}
                      onChange={e => updateQuestion(question.id, 'text', e.target.value)}
                      className="w-full p-3 border rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      rows="2"
                    ></textarea>
                  </div>

                  {/* Soru Tipi Seçimi */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Cevap Tipi</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => updateQuestion(question.id, 'type', 'text')}
                        className={`flex-1 p-2 rounded-lg border text-sm font-medium transition-all ${question.type === 'text' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-400' : 'border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-400'}`}
                      >
                        Yazılı Cevap
                      </button>
                      <button 
                        type="button"
                        onClick={() => updateQuestion(question.id, 'type', 'multiple-choice')}
                        className={`flex-1 p-2 rounded-lg border text-sm font-medium transition-all ${question.type === 'multiple-choice' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-400' : 'border-slate-300 dark:border-slate-500 text-slate-600 dark:text-slate-400'}`}
                      >
                        Çoktan Seçmeli
                      </button>
                    </div>
                  </div>

                  {/* Şık Ekleme Alanı (Sadece Çoktan Seçmeli ise görünür) */}
                  {question.type === 'multiple-choice' && (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg space-y-2 border border-slate-200 dark:border-slate-600">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Seçenekler</label>
                      {question.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex gap-2 items-center">
                          <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-500 flex items-center justify-center text-xs text-slate-500 font-bold">
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <input 
                            type="text" 
                            placeholder={`Seçenek ${optIdx + 1}`}
                            value={opt}
                            onChange={(e) => updateQuestionOption(question.id, optIdx, e.target.value)}
                            className="flex-1 p-2 border rounded-md dark:bg-slate-700 dark:text-white dark:border-slate-600 focus:border-indigo-500 outline-none text-sm"
                          />
                          {question.options.length > 2 && (
                            <button 
                              type="button" 
                              onClick={() => removeOptionFromQuestion(question.id, optIdx)} 
                              className="text-red-400 hover:text-red-600"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={() => addOptionToQuestion(question.id)}
                        className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1 mt-2"
                      >
                        <Plus size={14}/> Seçenek Ekle
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Yeni Soru Ekle Butonu */}
              <button 
                type="button"
                onClick={addQuestion}
                className="w-full py-3 border-2 border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/10 font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={18}/> Yeni Soru Ekle
              </button>
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-bold shadow-md shadow-indigo-200 transition-all">
              Anketi Yayınla
            </button>
          </form>
        </div>
      )}

      {/* --- ÖĞRENCİ: ANKET CEVAPLAMA EKRANI --- */}
      {role === 'student' && activeSurvey && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-indigo-200 dark:border-slate-600 shadow-xl animate-scale-in">
          <div className="flex justify-between mb-6 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-xl dark:text-white">{activeSurvey.title}</h3>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded mt-1 inline-block">
                {activeSurvey.questions && activeSurvey.questions[0] && activeSurvey.questions[0].type === 'multiple-choice'
                  ? 'Seçmeli Anket'
                  : 'Açık Uçlu Soru'}
              </span>
            </div>
            <button onClick={() => setActiveSurvey(null)} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {activeSurvey.questions.map((q, idx) => (
              <div key={q._id || idx}>
                <p className="font-medium text-lg text-slate-800 dark:text-slate-200 mb-4">
                  <span className="text-indigo-600 font-bold mr-2">{idx + 1}.</span> {q.questionText}
                </p>

                {/* TİPE GÖRE GÖSTERİM */}
                {q.type === 'multiple-choice' ? (
                  // ŞIKLI CEVAP
                  <div className="space-y-3">
                    {q.options.map((opt, optIdx) => (
                      <label 
                        key={optIdx} 
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          answers[q._id] === opt 
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500' 
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name={`question-${q._id}`} 
                          value={opt}
                          onChange={(e) => setAnswers({...answers, [q._id]: e.target.value})}
                          className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="dark:text-slate-200">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  // KLASİK CEVAP
                  <textarea 
                    className="w-full p-4 border rounded-xl dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    rows="4"
                    placeholder="Cevabınızı buraya detaylıca yazınız..."
                    onChange={(e) => setAnswers({...answers, [q._id]: e.target.value})}
                  ></textarea>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={() => handleSubmitResponse(activeSurvey._id)}
            className="mt-6 bg-green-600 text-white px-8 py-3 rounded-xl w-full hover:bg-green-700 flex items-center justify-center gap-2 font-bold shadow-lg shadow-green-200 transition-transform hover:scale-[1.01]"
          >
            <Send size={20}/> Cevabı Gönder
          </button>
        </div>
      )}

      {/* --- LİSTELEME --- */}
      <div className="grid gap-4">
        {role === 'teacher' && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Durum:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="p-2 rounded-lg border text-sm dark:bg-slate-800 dark:text-white"
              >
                {['Tümü', 'active', 'closed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="text-xs text-slate-500">Toplam: {total}</div>
          </div>
        )}
        {surveys.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
             <FileText size={48} className="mb-4 opacity-50" />
             <p>Henüz aktif bir anket bulunmuyor.</p>
           </div>
        ) : (
          surveys.map((survey) => (
            <div key={survey._id} className="group bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${
                   survey.questions[0]?.type === 'multiple-choice' 
                    ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20' 
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                }`}>
                  {survey.questions[0]?.type === 'multiple-choice' ? <CheckCircle size={24}/> : <FileText size={24}/>}
                </div>
                <div>
                  <h4 className="font-bold text-lg dark:text-white group-hover:text-indigo-600 transition-colors">{survey.title}</h4>
                  <div className="flex gap-3 text-xs text-slate-500 mt-1">
                     <span className="flex items-center gap-1"><Circle size={8} fill="currentColor"/> {survey.questions.length} Soru</span>
                     <span className="flex items-center gap-1"><Circle size={8} fill="currentColor"/> {survey.responses.length} Katılım</span>
                     <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                       {survey.questions[0]?.type === 'multiple-choice' ? 'Seçmeli' : 'Klasik'}
                     </span>
                     {role === 'teacher' && (
                       <span className={`px-2 py-0.5 rounded text-white ${survey.status === 'active' ? 'bg-green-600' : 'bg-slate-500'}`}>
                         {survey.status || 'active'}
                       </span>
                     )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {role === 'teacher' ? (
                  <button 
                    onClick={() => handleDelete(survey._id)}
                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                ) : (
                  <button 
                    onClick={() => setActiveSurvey(survey)}
                    className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                  >
                    Katıl
                  </button>
                )}
                {role === 'teacher' && (
                  <button
                    onClick={async () => {
                      const next = survey.status === 'active' ? 'closed' : 'active';
                      const prev = surveys;
                      // iyimser güncelleme
                      setSurveys(prev.map(s => s._id === survey._id ? { ...s, status: next } : s));
                      try {
                        await apiClient.put(`/surveys/${survey._id}`, { status: next });
                        showToast(`Anket ${next === 'active' ? 'aktif' : 'kapalı'} yapıldı`, 'success');
                      } catch (err) {
                        setSurveys(prev);
                        showToast('Durum güncellenemedi', 'error');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
                  >{survey.status === 'active' ? 'Kapat' : 'Aktif Et'}</button>
                )}
              </div>
            </div>
          ))
        )}
        {role === 'teacher' && pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
            >Önceki</button>
            <span className="text-xs font-bold text-slate-500">Sayfa {page} / {pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-800"
            >Sonraki</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveysPage;