import React, { useState } from 'react';
import { Target, Book, FileText, CheckCircle, ClipboardCheck } from 'lucide-react';
import FadeIn from '../components/ui/FadeIn';
import { getCurriculumData } from '../data/curriculumData';

const Curriculum = ({ lang, t }) => {
  const [activeGrade, setActiveGrade] = useState(1);
  const curriculumList = getCurriculumData(lang);
  const selectedCurriculum = curriculumList.find(c => c.grade === activeGrade) || curriculumList[0];

  return (
    <section id="curriculum" className="py-24 bg-white dark:bg-gray-900 scroll-mt-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100}>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t.curriculum.title} <span className="text-indigo-600 dark:text-indigo-400">{t.curriculum.titleHighlight}</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t.curriculum.desc}
            </p>
          </div>
        </FadeIn>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <FadeIn delay={200} direction="right">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 sticky top-28 h-fit max-h-[80vh] overflow-y-auto custom-scrollbar transition-colors duration-300">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 sticky top-0 bg-gray-50 dark:bg-gray-800 py-2 z-10">
                  <Target className="text-indigo-600 dark:text-indigo-400" /> {t.curriculum.selectGrade}
                </h3>
                <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
                  {curriculumList.map((item) => (
                    <button
                      key={item.grade}
                      onClick={() => setActiveGrade(item.grade)}
                      className={`py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 border flex items-center justify-center lg:justify-start gap-2 ${
                        activeGrade === item.grade
                          ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-md transform scale-[1.02]'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${activeGrade === item.grade ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-600'}`}>
                        {item.grade}
                      </span>
                      <span className="hidden sm:inline">{item.grade}. {t.curriculum.gradeLabel}</span>
                      <span className="sm:hidden">{item.grade}</span>
                    </button>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>

          <div className="lg:w-3/4">
            <FadeIn delay={300} direction="left">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden min-h-[500px] flex flex-col transition-colors duration-300">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-900 dark:to-purple-900 p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2 opacity-90">
                      <Book size={20} />
                      <span className="uppercase tracking-wider text-xs md:text-sm font-bold bg-white/20 px-3 py-1 rounded-full">{t.curriculum.programTitle}</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-3">{selectedCurriculum.title}</h3>
                    <p className="text-indigo-50 dark:text-gray-300 text-base md:text-lg max-w-2xl">{selectedCurriculum.description}</p>
                  </div>
                </div>

                <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8 flex-1">
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-lg md:text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
                      <FileText className="text-indigo-500 dark:text-indigo-400" /> {t.curriculum.topics}
                    </h4>
                    <ul className="space-y-2">
                      {selectedCurriculum.topics.map((topic, index) => (
                        <li key={index} className="flex items-center gap-3 bg-gray-50/80 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-gray-600 hover:border-indigo-100 transition-colors group">
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-500 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-400 transition-colors"></div>
                          <span className="font-medium text-gray-700 dark:text-gray-200 text-sm md:text-base">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-lg md:text-xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2">
                      <CheckCircle className="text-green-500 dark:text-green-400" /> {t.curriculum.outcomes}
                    </h4>
                    <ul className="space-y-3">
                      {selectedCurriculum.outcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-3 group">
                          <div className="mt-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full p-0.5 shrink-0 group-hover:bg-green-500 group-hover:text-white transition-colors">
                            <CheckCircle size={14} />
                          </div>
                          <span className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="px-6 md:px-8 pb-8 mt-auto">
                  <div className="bg-orange-50/80 dark:bg-orange-900/10 rounded-xl p-6 border border-orange-100 dark:border-orange-800 flex flex-col md:flex-row gap-5 hover:shadow-sm transition-shadow">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full h-fit w-fit text-orange-600 dark:text-orange-400 shrink-0">
                      <ClipboardCheck size={28} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.curriculum.evaluation}</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed">
                        {selectedCurriculum.evaluation}
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