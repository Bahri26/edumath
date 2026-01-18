import React, { useState, useMemo } from 'react';
import { Target, Book, FileText, CheckCircle, ClipboardCheck, Layers, ArrowRight } from 'lucide-react';
import FadeIn from '../components/ui/FadeIn';
import { getCurriculumData } from '../data/curriculumData';

const Curriculum = ({ lang, t }) => {
  const [activeGrade, setActiveGrade] = useState(1);
  
  // Örüntü odaklı veriyi çekiyoruz
  const curriculumList = useMemo(() => getCurriculumData(lang), [lang]);
  const selectedCurriculum = curriculumList.find(c => c.grade === activeGrade) || curriculumList[0];

  // Seviyeye göre dinamik renk belirleme (İlkokul: Turuncu, Ortaokul: Indigo, Lise: Mor)
  const getLevelColor = (grade) => {
    if (grade <= 4) return 'from-orange-500 to-amber-500 dark:from-orange-900 dark:to-amber-900';
    if (grade <= 8) return 'from-indigo-600 to-blue-600 dark:from-indigo-900 dark:to-blue-900';
    return 'from-purple-600 to-fuchsia-600 dark:from-purple-900 dark:to-fuchsia-900';
  };

  return (
    <section id="curriculum" className="py-24 bg-gray-50 dark:bg-gray-900/50 scroll-mt-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Başlık Alanı */}
        <FadeIn delay={100}>
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-4 py-1 rounded-full text-sm font-bold tracking-widest uppercase">
                {t.curriculum.programTitle}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
              {t.curriculum.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{t.curriculum.titleHighlight}</span>
            </h2>
            <p className="text-base sm:text-lg text-indigo-700 dark:text-indigo-300 font-semibold mb-2">
              İlkokul, Ortaokul ve Lise seviyelerine özel içerikler!
            </p>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t.curriculum.desc}
            </p>
          </div>
        </FadeIn>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Sol Panel: Sınıf Seçimi */}
          <div className="lg:w-1/3 xl:w-1/4">
            <FadeIn delay={200} direction="right">
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 sticky top-28">
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <Layers className="text-indigo-600" size={24} /> {t.curriculum.selectGrade}
                </h3>
                
                {/* Scroll edilebilir sınıf butonları alanı */}
                <div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto pb-4 lg:pb-0 gap-3 no-scrollbar max-h-[60vh]">
                  {curriculumList.map((item) => (
                    <button
                      key={item.grade}
                      onClick={() => setActiveGrade(item.grade)}
                      className={`group relative flex-shrink-0 lg:flex-shrink-1 flex items-center gap-4 p-4 rounded-2xl font-bold transition-all duration-300 border-2 ${
                        activeGrade === item.grade
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-transparent text-gray-600 dark:text-gray-400 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-white dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                        activeGrade === item.grade ? 'bg-white/20' : 'bg-white dark:bg-gray-800 shadow-sm'
                      }`}>
                        {item.grade}
                      </span>
                      <div className="text-left">
                        <p className="text-xs opacity-70 uppercase tracking-tighter">{t.curriculum.gradeLabel}</p>
                        <p className="whitespace-nowrap">{item.levelName}</p>
                      </div>
                      {activeGrade === item.grade && (
                        <ArrowRight className="ml-auto hidden lg:block animate-pulse" size={18} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Sağ Panel: Müfredat Detayları */}
          <div className="lg:w-2/3 xl:w-3/4">
            <FadeIn delay={300} key={activeGrade}> {/* Grade değişiminde animasyonu tetikler */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl shadow-indigo-100/20 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[600px] flex flex-col">
                
                {/* Header Banner */}
                <div className={`bg-gradient-to-br ${getLevelColor(activeGrade)} p-8 md:p-12 text-white relative transition-all duration-500`}>
                  <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                  <div className="relative z-10">
                    <h3 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
                      {selectedCurriculum.title}
                    </h3>
                    <p className="text-indigo-50 dark:text-gray-200 text-lg md:text-xl max-w-3xl leading-relaxed opacity-90">
                      {selectedCurriculum.description}
                    </p>
                  </div>
                </div>

                {/* İçerik Izgarası */}
                <div className="p-8 md:p-12 grid md:grid-cols-2 gap-12 flex-1">
                  
                  {/* Konu Başlıkları */}
                  <div className="space-y-6">
                    <h4 className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white group">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        <FileText size={22} />
                      </div>
                      {t.curriculum.topics}
                    </h4>
                    <ul className="space-y-3">
                      {selectedCurriculum.topics.map((topic, index) => (
                        <li key={index} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all">
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500"></span>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Kazanımlar */}
                  <div className="space-y-6">
                    <h4 className="flex items-center gap-3 text-xl font-bold text-gray-900 dark:text-white group">
                      <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                        <CheckCircle size={22} />
                      </div>
                      {t.curriculum.outcomes}
                    </h4>
                    <ul className="grid gap-4">
                      {selectedCurriculum.outcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-4">
                          <div className="mt-1 bg-green-500 text-white rounded-full p-1 shrink-0">
                            <CheckCircle size={12} />
                          </div>
                          <span className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Değerlendirme Bölümü */}
                <div className="p-8 md:p-12 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="p-5 bg-orange-100 dark:bg-orange-900/30 rounded-2xl text-orange-600 dark:text-orange-400">
                      <ClipboardCheck size={40} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.curriculum.evaluation}</h4>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed italic">
                        "{selectedCurriculum.evaluation}"
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Curriculum;