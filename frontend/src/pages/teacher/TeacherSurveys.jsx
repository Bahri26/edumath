import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Users, Send } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getMySurveys, createSurvey, deleteSurvey, getSurveyStats } from '../../services/surveyService';

const TeacherSurveys = () => {
  const { showToast } = useToast();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [surveyStats, setSurveyStats] = useState(null);

  // Yeni anket formu
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    description: '',
    questions: [{ questionText: '', type: 'text' }]
  });
  
  const titleInputRef = React.useRef(null);
  
  // Modal açılış/kapatış efekti
  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [showCreateModal]);
  
  useEffect(() => {
    if (showStatsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [showStatsModal]);

  // Anketleri getir
  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const data = await getMySurveys();
      setSurveys(data.surveys || []);
    } catch (error) {
      showToast('Anketler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Yeni soru ekle
  const addQuestion = () => {
    setNewSurvey({
      ...newSurvey,
      questions: [...newSurvey.questions, { questionText: '', type: 'text' }]
    });
  };

  // Soruyu sil
  const removeQuestion = (index) => {
    const questions = newSurvey.questions.filter((_, i) => i !== index);
    setNewSurvey({ ...newSurvey, questions });
  };

  // Soruyu güncelle
  const updateQuestion = (index, field, value) => {
    const questions = [...newSurvey.questions];
    questions[index][field] = value;
    setNewSurvey({ ...newSurvey, questions });
  };

  // Anket oluştur
  const handleCreateSurvey = async (e) => {
    e.preventDefault();
    
    if (!newSurvey.title || newSurvey.questions.length === 0) {
      showToast('Başlık ve en az bir soru gerekli', 'error');
      return;
    }

    const emptyQuestions = newSurvey.questions.filter(q => !q.questionText.trim());
    if (emptyQuestions.length > 0) {
      showToast('Tüm soruları doldurun', 'error');
      return;
    }

    try {
      await createSurvey(newSurvey);
      showToast('Anket başarıyla oluşturuldu', 'success');
      setShowCreateModal(false);
      setNewSurvey({ title: '', description: '', questions: [{ questionText: '', type: 'text' }] });
      fetchSurveys();
    } catch (error) {
      showToast('Anket oluşturulamadı', 'error');
    }
  };

  // Anket sil
  const handleDeleteSurvey = async (surveyId) => {
    if (!confirm('Bu anketi silmek istediğinize emin misiniz?')) return;

    try {
      await deleteSurvey(surveyId);
      showToast('Anket silindi', 'success');
      fetchSurveys();
    } catch (error) {
      showToast('Anket silinemedi', 'error');
    }
  };

  // İstatistikleri göster
  const handleShowStats = async (survey) => {
    try {
      const stats = await getSurveyStats(survey._id);
      setSurveyStats(stats);
      setSelectedSurvey(survey);
      setShowStatsModal(true);
    } catch (error) {
      showToast('İstatistikler yüklenemedi', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="glass-card p-6 rounded-2xl border border-white/30 dark:border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <FileText size={32} className="text-indigo-600" /> Anket Yönetimi
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Öğrencileriniz için anket oluşturun ve sonuçları analiz edin</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-[1.25rem] font-black flex items-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            <Plus size={20} strokeWidth={3} /> Yeni Anket
          </button>
        </div>
      </div>

      {/* Anket Listesi */}
      {loading ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <div className="inline-flex items-center gap-3 text-slate-500">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-semibold">Yükleniyor...</span>
          </div>
        </div>
      ) : surveys.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center border border-dashed border-white/40 dark:border-slate-700">
          <FileText size={64} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 font-semibold">Henüz anket oluşturmadınız</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <div
              key={survey._id}
              className="glass-card rounded-[1.5rem] border border-white/30 dark:border-slate-800 p-6 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-black text-lg text-slate-900 dark:text-white">{survey.title}</h3>
                <button
                  onClick={() => handleDeleteSurvey(survey._id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                {survey.description || 'Açıklama yok'}
              </p>
              
              <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <FileText size={14} />
                  <span>{survey.questions?.length || 0} soru</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={14} />
                  <span>{survey.responseCount || 0} cevap</span>
                </div>
              </div>

              <button
                onClick={() => handleShowStats(survey)}
                className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white px-4 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Sonuçları Gör
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Anket Oluşturma Modalı */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto pt-8 md:pt-20">
          <div className="shell-strong rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-white/30 dark:border-slate-700 shadow-2xl mb-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Yeni Anket Oluştur</h2>
            
            <form onSubmit={handleCreateSurvey} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Anket Başlığı *
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={newSurvey.title}
                  onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-white/40 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                  placeholder="Örn: Ders Memnuniyet Anketi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Açıklama
                </label>
                <textarea
                  value={newSurvey.description}
                  onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-white/40 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                  rows="3"
                  placeholder="Anket hakkında kısa bir açıklama..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Sorular *
                  </label>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-sm"
                  >
                    <Plus size={16} /> Soru Ekle
                  </button>
                </div>

                {newSurvey.questions.map((question, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={question.questionText}
                      onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl border border-white/40 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                      placeholder={`Soru ${index + 1}`}
                      required
                    />
                    {newSurvey.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewSurvey({ title: '', description: '', questions: [{ questionText: '', type: 'text' }] });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/40 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 transition-all font-semibold"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <Send size={18} /> Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* İstatistik Modalı */}
      {showStatsModal && surveyStats && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto pt-8 md:pt-20">
          <div className="shell-strong rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto border border-white/30 dark:border-slate-700 shadow-2xl mb-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{surveyStats.title}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Toplam {surveyStats.totalResponses} cevap alındı
            </p>

            <div className="space-y-6">
              {surveyStats.questions?.map((q, index) => (
                <div key={index} className="glass-card rounded-2xl border border-white/30 dark:border-slate-800 p-4">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">
                    {index + 1}. {q.questionText}
                  </h3>
                  <div className="space-y-2">
                    {q.answers?.map((ans, i) => (
                      <div key={i} className="bg-white/70 dark:bg-slate-800/70 rounded-xl p-3 border border-white/40 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          <span className="font-semibold">{ans.studentName}:</span> {ans.answer}
                        </p>
                      </div>
                    ))}
                    {q.answers?.length === 0 && (
                      <p className="text-sm text-slate-500 italic">Henüz cevap verilmedi</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowStatsModal(false);
                setSurveyStats(null);
              }}
              className="w-full mt-6 bg-white/80 dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-3 rounded-xl border border-white/40 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all font-bold"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSurveys;
