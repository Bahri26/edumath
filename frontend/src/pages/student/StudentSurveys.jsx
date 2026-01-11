import React, { useState, useEffect } from 'react';
import { FileText, Send, CheckCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getAvailableSurveys, submitSurveyResponse, getSurveyById } from '../../services/surveyService';

const StudentSurveys = () => {
  const { showToast } = useToast();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [surveyDetails, setSurveyDetails] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const data = await getAvailableSurveys();
      setSurveys(data.surveys || []);
    } catch (error) {
      showToast('Anketler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSurvey = async (survey) => {
    if (survey.hasResponded) {
      showToast('Bu anketi zaten cevapladınız', 'info');
      return;
    }

    try {
      const details = await getSurveyById(survey._id);
      setSurveyDetails(details);
      setSelectedSurvey(survey);
      setAnswers({});
      setShowSurveyModal(true);
    } catch (error) {
      showToast('Anket detayları yüklenemedi', 'error');
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    });
  };

  const handleSubmitSurvey = async (e) => {
    e.preventDefault();

    // Tüm soruların cevaplanıp cevaplanmadığını kontrol et
    const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer
    }));

    if (answersArray.length !== surveyDetails?.questions?.length) {
      showToast('Lütfen tüm soruları cevaplayın', 'error');
      return;
    }

    try {
      await submitSurveyResponse(selectedSurvey._id, answersArray);
      showToast('Anket cevabınız kaydedildi', 'success');
      setShowSurveyModal(false);
      setSelectedSurvey(null);
      setSurveyDetails(null);
      setAnswers({});
      fetchSurveys();
    } catch (error) {
      showToast('Cevap gönderilemedi', 'error');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Anketler</h1>
        <p className="text-slate-500 dark:text-slate-400">Öğretmeninizin oluşturduğu anketleri cevaplayın</p>
      </div>

      {/* Anket Listesi */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Yükleniyor...</div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>Şu anda cevaplayabileceğiniz anket bulunmuyor</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <div
              key={survey._id}
              className={`bg-white dark:bg-slate-800 rounded-xl border ${
                survey.hasResponded
                  ? 'border-green-200 dark:border-green-900'
                  : 'border-slate-200 dark:border-slate-700'
              } p-6 hover:shadow-lg transition-all`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{survey.title}</h3>
                {survey.hasResponded && (
                  <CheckCircle size={24} className="text-green-500" />
                )}
              </div>

              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                {survey.description || 'Açıklama yok'}
              </p>

              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
                <FileText size={16} />
                <span>{survey.questionCount || 0} soru</span>
              </div>

              <button
                onClick={() => handleOpenSurvey(survey)}
                disabled={survey.hasResponded}
                className={`w-full px-4 py-2 rounded-lg transition-colors ${
                  survey.hasResponded
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {survey.hasResponded ? 'Cevaplandı' : 'Anketi Cevapla'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Anket Cevaplama Modalı */}
      {showSurveyModal && selectedSurvey && surveyDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
              {surveyDetails.title}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {surveyDetails.description}
            </p>

            <form onSubmit={handleSubmitSurvey} className="space-y-6">
              {/* Sorular */}
              <div className="space-y-4">
                {surveyDetails.questions?.map((question, index) => (
                  <div key={question._id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {index + 1}. {question.questionText}
                    </label>
                    <textarea
                      value={answers[question._id] || ''}
                      onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      rows="3"
                      placeholder="Cevabınızı yazın..."
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowSurveyModal(false);
                    setSelectedSurvey(null);
                    setSurveyDetails(null);
                    setAnswers({});
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSurveys;
