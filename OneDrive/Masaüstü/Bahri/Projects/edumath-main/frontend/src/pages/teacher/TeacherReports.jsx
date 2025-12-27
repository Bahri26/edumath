import React, { useState, useContext, useEffect } from 'react';
import { 
  BarChart2, TrendingUp, TrendingDown, Users, AlertCircle, 
  Download, Calendar, ChevronDown, CheckCircle, PieChart, Activity
} from 'lucide-react';
import { LanguageContext } from '../../context/LanguageContext';

const TeacherReports = () => {
  const { language } = useContext(LanguageContext);
  const [period, setPeriod] = useState('Bu Dönem');
  const [loading, setLoading] = useState(true);

  // Dil Sözlüğü
  const t = {
    TR: {
      title: "Sınıf Analizi & Raporlar",
      subtitle: "11-A Sınıfı performans metrikleri ve gelişim özeti.",
      period: "Bu Dönem",
      downloadPDF: "PDF Raporu",
      classAvg: "Sınıf Ortalaması",
      examParticipation: "Katılım Oranı",
      topTopic: "En Güçlü Konu",
      needsSupport: "Destek Gereken",
      riskAnalysis: "İlgi Gerektiren Öğrenciler",
      viewAll: "Tümünü Gör",
    },
    EN: {
      title: "Class Analysis & Reports",
      subtitle: "11-A performance metrics and progress summary.",
      period: "This Period",
      downloadPDF: "Download PDF",
      classAvg: "Class Average",
      examParticipation: "Exam Participation",
      topTopic: "Top Topic",
      needsSupport: "Needs Support",
      riskAnalysis: "Students At Risk",
      viewAll: "View All",
    }
  };
  const getText = (key) => t[language]?.[key] || t.TR[key];

  // Simüle edilmiş API isteği
  useEffect(() => {
    // 800ms sonra sahte veriyi "yüklemiş" gibi yap
    setTimeout(() => setLoading(false), 800);
  }, []);

  // --- MOCK DATA GENERATORS (API olmadığı durumlar için) ---
  const getStats = () => ([
    { title: getText("classAvg"), value: "74.8", change: "+3.2%", isPositive: true, icon: BarChart2, color: "indigo" },
    { title: getText("examParticipation"), value: "%96", change: "-1.5%", isPositive: false, icon: Users, color: "blue" },
    { title: getText("topTopic"), value: "Fonksiyonlar", sub: "%89 Başarı", icon: CheckCircle, color: "green" },
    { title: getText("needsSupport"), value: "Trigonometri", sub: "%42 Başarı", icon: AlertCircle, color: "red" },
  ]);

  const getTopicPerformance = () => ([
    { topic: "Polinomlar", score: 78, trend: 'up' },
    { topic: "II. Dereceden Denklemler", score: 65, trend: 'stable' },
    { topic: "Trigonometri I", score: 42, trend: 'down' },
    { topic: "Trigonometri II", score: 38, trend: 'down' },
    { topic: "Fonksiyonlar", score: 89, trend: 'up' },
    { topic: "Logaritma", score: 72, trend: 'up' },
  ]);

  const getStudentRisks = () => ([
    { name: "Ali Yılmaz", issue: "Son 3 sınavda %30 düşüş", avg: 42, avatar: "AY" },
    { name: "Zeynep Demir", issue: "Ödev teslim oranı kritik (%20)", avg: 55, avatar: "ZD" },
    { name: "Burak Kaya", issue: "Devamsızlık riski", avg: 61, avatar: "BK" },
    { name: "Elif Şahin", issue: "Derse katılım yetersiz", avg: 48, avatar: "EŞ" },
  ]);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
         <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
         <div className="grid grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>)}
         </div>
      </div>
    );
  }

  const stats = getStats();
  const topicPerformance = getTopicPerformance();
  const studentRisks = getStudentRisks();

  // Renk yardımcıları
  const getColorClasses = (color) => {
    const map = {
        indigo: 'bg-indigo-50 text-indigo-600',
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        red: 'bg-rose-50 text-rose-600',
    };
    return map[color] || map.indigo;
  };

  return (
    <div className="animate-fade-in space-y-8 p-6 pb-20 max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{getText("title")}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{getText("subtitle")}</p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors">
               <Calendar size={18} className="text-slate-400"/>
               {period}
               <ChevronDown size={16} className="text-slate-400 ml-1"/>
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-200 dark:shadow-indigo-900/30 hover:-translate-y-0.5 transition-all">
               <Download size={18}/>
               {getText("downloadPDF")}
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
             {/* Decorative Background Icon */}
             <stat.icon className="absolute -right-4 -bottom-4 text-slate-50 dark:text-slate-700/30 w-32 h-32 opacity-50 group-hover:scale-110 transition-transform duration-500" />
             
             <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl ${getColorClasses(stat.color)}`}>
                        <stat.icon size={24} />
                    </div>
                    {stat.change && (
                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {stat.isPositive ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                            {stat.change}
                        </div>
                    )}
                 </div>
                 <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-1">{stat.value}</h3>
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                 {stat.sub && <p className="text-xs font-semibold text-slate-400 mt-2 flex items-center gap-1"><Activity size={12}/> {stat.sub}</p>}
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Topic Performance Bar Chart (Visualized with CSS) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <PieChart className="text-indigo-500" size={20}/> 
                    Konu Başarı Analizi
                 </h3>
                 <button className="text-xs font-bold text-indigo-600 hover:underline">Detaylı Rapor</button>
             </div>
             
             <div className="space-y-6">
                {topicPerformance.map((item, idx) => (
                    <div key={idx} className="group">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{item.topic}</span>
                            <span className="font-bold text-slate-600 dark:text-slate-400">%{item.score}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
                                    item.score >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 
                                    item.score >= 60 ? 'bg-indigo-500' : 
                                    item.score >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                                }`} 
                                style={{ width: `${item.score}%` }}
                            >
                                <div className="absolute top-0 left-0 bottom-0 right-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>

          {/* Risk List */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                 <div className="p-2 bg-rose-100 dark:bg-rose-900/20 rounded-lg">
                    <AlertCircle className="text-rose-600" size={20}/>
                 </div>
                 <div>
                     <h3 className="font-bold text-lg text-slate-800 dark:text-white">{getText("riskAnalysis")}</h3>
                     <p className="text-xs text-slate-400">Acil aksiyon gerektiren durumlar</p>
                 </div>
              </div>

              <div className="space-y-3 flex-1">
                  {studentRisks.map((student, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 hover:border-rose-200 transition-colors group cursor-pointer">
                          <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-600 flex items-center justify-center font-bold text-slate-700 dark:text-white border border-slate-200 dark:border-slate-500 text-xs shadow-sm">
                              {student.avatar}
                          </div>
                          <div className="flex-1">
                              <div className="flex justify-between items-start">
                                 <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{student.name}</h4>
                                 <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded">Ort: {student.avg}</span>
                              </div>
                              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium flex items-center gap-1">
                                <TrendingDown size={10} /> {student.issue}
                              </p>
                          </div>
                      </div>
                  ))}
              </div>
              
              <button className="mt-4 w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors">
                  {getText("viewAll")}
              </button>
          </div>

      </div>
      
      <style>{`
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default TeacherReports;