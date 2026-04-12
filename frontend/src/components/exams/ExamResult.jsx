import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import apiClient from '../../services/api';
import AIPractice from './AIPractice';

const ExamResult = ({ result, onBack }) => {
  const [loadingAI, setLoadingAI] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState(null);

  const handleGeneratePractice = async () => {
    if (!result?.weakTopics || result.weakTopics.length === 0) return;
    
    setLoadingAI(true);
    setPracticeQuestions(null);
    try {
      const res = await apiClient.post('/ai/practice', { 
        weakTopics: result.weakTopics,
        difficulty: 'Orta', // This could be a user option in the future
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

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pt-6 pb-20 space-y-8">
      {/* Result Card */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.score >= 50 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500'}`}>
           {result.score >= 50 ? <CheckCircle size={40} /> : <AlertTriangle size={40} />}
        </div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Sınav Tamamlandı!</h2>
        <p className="text-slate-500 mb-6">Başarı Puanın: 
          <span className={`text-2xl font-bold ${result.score >= 50 ? 'text-green-600' : 'text-orange-500'}`}>
            {result.score}
          </span>
        </p>
        
        {/* Weak Topics List */}
        {result.weakTopics && result.weakTopics.length > 0 ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 max-w-lg mx-auto mb-6 text-left">
            <h3 className="font-bold text-red-700 dark:text-red-300 flex items-center gap-2 mb-3">
              <AlertTriangle size={18}/> Geliştirilmesi Gereken Konular:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-red-600 dark:text-red-400">
              {result.weakTopics.map((topic, i) => (
                <li key={i}>{topic}</li>
              ))}
            </ul>
            
            {/* AI Button - Show only if practice questions haven't been generated yet */}
            {!practiceQuestions && (
              <button 
                onClick={handleGeneratePractice} 
                disabled={loadingAI}
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-200 dark:shadow-none disabled:bg-purple-400"
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

        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 underline">
          Listeye Dön
        </button>
      </div>

      {/* AI-Generated Practice Area */}
      <AIPractice questions={practiceQuestions} />

      {/* Show a "Finish Practice" button only when practice is active */}
      {practiceQuestions && (
         <div className="text-center mt-10">
            <button onClick={onBack} className="bg-slate-800 text-white px-8 py-3 rounded-xl hover:bg-slate-700">Antrenmanı Bitir</button>
         </div>
      )}
    </div>
  );
};

export default ExamResult;
