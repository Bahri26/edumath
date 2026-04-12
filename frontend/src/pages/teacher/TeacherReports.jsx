import React, { useState, useContext } from 'react';
import { 
  BarChart2, TrendingUp, TrendingDown, Users, AlertCircle, 
  Download, Calendar, ChevronDown, CheckCircle 
} from 'lucide-react';
import { LanguageContext } from '../../context/LanguageContext';

const TeacherReports = () => {
  const { language } = useContext(LanguageContext);
  const [period, setPeriod] = useState('Bu Dönem');

  // --- DİL ÇEVIRILERI ---
  const t = {
    TR: {
      title: "Sınıf Raporları",
      subtitle: "11-A Sınıfı detaylı başarı analizi.",
      period: "Bu Dönem",
      downloadPDF: "PDF İndir",
      classAvg: "Sınıf Ortalaması",
      examParticipation: "Sınav Katılımı",
      topTopic: "En Başarılı Konu",
      needsSupport: "Destek Gereken",
      topicPerformance: "Konu Bazlı Başarı Oranları",
      riskAnalysis: "İlgi Gerektirenler",
      viewAll: "Tüm Listeyi Gör",
    },
    EN: {
      title: "Class Reports",
      subtitle: "11-A class detailed performance analysis.",
      period: "This Period",
      downloadPDF: "Download PDF",
      classAvg: "Class Average",
      examParticipation: "Exam Participation",
      topTopic: "Top Topic",
      needsSupport: "Needs Support",
      topicPerformance: "Topic Performance",
      riskAnalysis: "Students At Risk",
      viewAll: "View All",
    }
  };

  const getText = (key) => t[language]?.[key] || t.TR[key];

  // --- RENK HELPER FONKSİYONU (Tailwind Dinamik Renk Problemi Çözümü) ---
  const getColorClass = (color) => {
    const colorMap = {
      indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    };
    return colorMap[color] || colorMap.indigo;
  };

  // --- VERİLERİ API'DEN ALMAYA UYGUN HALE GETİR ---
  // Şu an mock, ileride API'den çekilecek şekilde fonksiyonel olarak ayrıldı
  const getStats = () => ([
    { title: getText("classAvg"), value: "72.4", change: "+5%", isPositive: true, icon: BarChart2, color: "indigo" },
    { title: getText("examParticipation"), value: "%94", change: "-2%", isPositive: false, icon: Users, color: "blue" },
    { title: getText("topTopic"), value: "Matrisler", sub: "%88 Başarı", icon: CheckCircle, color: "green" },
    { title: getText("needsSupport"), value: "Türev", sub: "%45 Başarı", icon: AlertCircle, color: "red" },
  ]);

  const getTopicPerformance = () => ([
    { topic: "Trigonometri", score: 85, total: 100 },
    { topic: "Limit ve Süreklilik", score: 72, total: 100 },
    { topic: "Türev", score: 45, total: 100 },
    { topic: "İntegral", score: 55, total: 100 },
    { topic: "Analitik Geometri", score: 92, total: 100 },
  ]);

  const getStudentRisks = () => ([
    { name: "Mehmet Demir", issue: "Son 3 sınav notu düşüşte", avg: 45 },
    { name: "Ayşe Kaya", issue: "Ödev teslim oranı düşük", avg: 52 },
    { name: "Can Yılmaz", issue: "Devamsızlık riski", avg: 60 },
  ]);

  const stats = getStats();
  const topicPerformance = getTopicPerformance();
  const studentRisks = getStudentRisks();

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* --- BAŞLIK VE FİLTRE --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{getText("title")}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{getText("subtitle")}</p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm">
                <Calendar size={16}/>
                {period}
                <ChevronDown size={14} className="opacity-50"/>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-md shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors">
                <Download size={16}/>
                {getText("downloadPDF")}
            </button>
        </div>
      </div>

      {/* --- ÜST KARTLAR --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${getColorClass(stat.color)}`}>
                    <stat.icon size={24} />
                </div>
                {stat.change && (
                    <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stat.isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {stat.isPositive ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
                        {stat.change}
                    </span>
                )}
             </div>
             <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
             {stat.sub && <p className="text-xs font-medium text-slate-400 mt-1">{stat.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* --- KONU BAŞARI ANALİZİ (BAR GRAFİK) --- */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
             <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6">{getText("topicPerformance")}</h3>
             <div className="space-y-5">
                {topicPerformance.map((item, idx) => (
                    <div key={idx}>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{item.topic}</span>
                            <span className="font-bold text-slate-600 dark:text-slate-400">%{item.score}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                    item.score >= 80 ? 'bg-green-500' : 
                                    item.score >= 60 ? 'bg-indigo-500' : 
                                    item.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} 
                                style={{ width: `${item.score}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
             </div>
          </div>

          {/* --- RİSK ANALİZİ (LİSTE) --- */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                 <AlertCircle className="text-red-500" size={20}/>
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white">{getText("riskAnalysis")}</h3>
              </div>
              <div className="space-y-4">
                  {studentRisks.map((student, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                          <div className="flex justify-between items-start">
                             <div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{student.name}</h4>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{student.issue}</p>
                             </div>
                             <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                                Ort: {student.avg}
                             </span>
                          </div>
                      </div>
                  ))}
                  <button className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">
                      {getText("viewAll")}
                  </button>
              </div>
          </div>

      </div>
    </div>
  );
};

export default TeacherReports;