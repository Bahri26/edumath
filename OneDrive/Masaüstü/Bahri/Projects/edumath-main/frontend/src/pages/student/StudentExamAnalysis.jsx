import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { CheckCircle, AlertTriangle, BarChart2, ArrowLeft, Sparkles, XCircle, HelpCircle } from 'lucide-react';

export default function StudentExamAnalysis() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnalysis() {
      setLoading(true);
      try {
        const res = await apiClient.get(`/exams/${examId}/analysis`);
        setAnalysis(res.data);
      } catch (err) {
        console.error(err);
        setError('Analiz verisi alınamadı.');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, [examId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500">Sınavın analiz ediliyor...</p>
    </div>
  );

  if (error) return <div className="p-10 text-center text-rose-500 font-medium">{error}</div>;
  if (!analysis) return null;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      
      {/* Üst Bar */}
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium"
      >
        <ArrowLeft size={20}/> Geri Dön
      </button>

      {/* 1. ÖZET KART (PUAN) */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-700 text-center mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border-4 ${
            analysis.score >= 50 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-500' 
            : 'bg-amber-50 border-amber-100 text-amber-500'
        }`}>
          {analysis.score >= 50 ? <CheckCircle size={48} /> : <AlertTriangle size={48}/>}
        </div>
        
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">Sınav Sonucun</h2>
        <div className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 my-4 tracking-tight">
            {analysis.score}<span className="text-2xl text-slate-400 font-medium">/100</span>
        </div>

        {/* Detaylı İstatistik Grid */}
        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
            <div className="flex flex-col items-center">
                <CheckCircle size={24} className="text-emerald-500 mb-2" />
                <span className="text-2xl font-bold text-emerald-600">{analysis.correctCount}</span>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Doğru</span>
            </div>
            <div className="flex flex-col items-center border-l border-r border-slate-100 dark:border-slate-700">
                <XCircle size={24} className="text-rose-500 mb-2" />
                <span className="text-2xl font-bold text-rose-500">{analysis.wrongCount}</span>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Yanlış</span>
            </div>
            <div className="flex flex-col items-center">
                <HelpCircle size={24} className="text-slate-400 mb-2" />
                <span className="text-2xl font-bold text-slate-600 dark:text-slate-300">{analysis.blankCount}</span>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Boş</span>
            </div>
        </div>
      </div>

      {/* 2. YAPAY ZEKA YORUMU (EĞER VARSA) */}
      {analysis.aiFeedback && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800 mb-6 relative">
            <div className="absolute -top-3 -left-3 bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm border border-indigo-100">
                <Sparkles className="text-purple-500 fill-purple-100" size={24} />
            </div>
            <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-200 mb-2 ml-2">Öğretmeninin Notu (AI)</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                "{analysis.aiFeedback}"
            </p>
        </div>
      )}

      {/* 3. ZORLUK DAĞILIMI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <BarChart2 size={18} className="text-indigo-500"/> Zorluk Seviyeleri
            </h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Kolay Sorular</span>
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{analysis.easyCount} adet</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Orta Sorular</span>
                    <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">{analysis.mediumCount} adet</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Zor Sorular</span>
                    <span className="text-sm font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">{analysis.hardCount} adet</span>
                </div>
            </div>
        </div>

        {/* 4. KONU ANALİZİ (VARSA) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Konu Başarısı</h3>
            <ul className="space-y-3">
            {analysis.topicStats && analysis.topicStats.length > 0 ? analysis.topicStats.map((topic, i) => (
                <li key={i} className="flex justify-between items-center pb-2 border-b border-slate-50 last:border-0">
                <span className="font-medium text-slate-600 dark:text-slate-300 text-sm">{topic.name}</span>
                <span className={`font-bold text-sm ${topic.successRate > 70 ? 'text-emerald-600' : 'text-amber-500'}`}>%{topic.successRate}</span>
                </li>
            )) : <li className="text-slate-400 text-sm italic py-4 text-center">Detaylı konu analizi bulunamadı.</li>}
            </ul>
        </div>
      </div>

      {/* 5. EKSİK KONULAR (VARSA) */}
      {analysis.weakTopics && analysis.weakTopics.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-2xl border border-rose-100 dark:border-rose-900/30">
          <h3 className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2 mb-3">
            <AlertTriangle size={20}/> Geliştirilmesi Gerekenler
          </h3>
          <p className="text-sm text-rose-600/80 mb-3">Aşağıdaki konularda biraz daha pratik yapman faydalı olabilir:</p>
          <div className="flex flex-wrap gap-2">
            {analysis.weakTopics.map((topic, i) => (
                <span key={i} className="bg-white dark:bg-rose-900/50 text-rose-600 dark:text-rose-200 px-3 py-1.5 rounded-lg text-sm font-medium border border-rose-100 shadow-sm">
                    {topic}
                </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}