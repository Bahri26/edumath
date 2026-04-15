import React from 'react';
import { Star, BookOpen, Users, ArrowRight, Zap } from 'lucide-react';
import FadeIn from '../components/ui/FadeIn';
import { getCourses } from '../data/coursesData';

const Courses = ({ lang, t }) => {
  const courses = getCourses(lang, t);
  const researchModules = lang === 'tr'
    ? [
        {
          title: 'Araştırma Alanları',
          desc: 'Cebirsel topoloji, sayılar teorisi, diferansiyel geometri ve ileri analiz başlıklarında derinleşin.',
        },
        {
          title: 'Seminer ve Okuma Grupları',
          desc: 'Haftalık seminerler, paper reading session yapıları ve tez ekseni etrafında topluluk çalışmaları.',
        },
        {
          title: 'Makale ve Preprint İnceleme',
          desc: 'Yüklenen metinlerden özet, proof roadmap, önkoşul listesi ve kavram haritası üretin.',
        },
        {
          title: 'İspat Atölyesi',
          desc: 'Lemma önerileri, karşı örnek taraması ve adım adım ispat stratejileri ile çalışın.',
        },
        {
          title: 'Tez ve Yayın Üretkenliği',
          desc: 'Literatür zinciri, açık problem listesi ve yayın hazırlık akışı için yapılandırılmış araçlar.',
        },
        {
          title: 'Akademik Yol Haritası',
          desc: 'Yüksek lisans temelden araştırma seviyesine kadar ilerleme planı ve uzmanlık rotaları.',
        },
      ]
    : [
        {
          title: 'Research Areas',
          desc: 'Go deeper in algebraic topology, number theory, differential geometry, and advanced analysis.',
        },
        {
          title: 'Seminars and Reading Groups',
          desc: 'Weekly seminars, paper reading sessions, and thesis-oriented collaborative study tracks.',
        },
        {
          title: 'Paper and Preprint Review',
          desc: 'Generate summaries, proof roadmaps, prerequisite maps, and concept structure from uploaded texts.',
        },
        {
          title: 'Proof Workshop',
          desc: 'Work with lemma suggestions, counterexample scans, and stepwise proof strategies.',
        },
        {
          title: 'Thesis and Publication Productivity',
          desc: 'Use structured tools for literature chains, open problem lists, and paper preparation flow.',
        },
        {
          title: 'Academic Roadmap',
          desc: 'Follow progression tracks from graduate foundations to research-level specialization.',
        },
      ];

  // Kategoriye göre renk belirleme fonksiyonu
  const getCategoryStyles = (category) => {
    switch (category) {
      case 'primary':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'middle':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'high':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <section id="courses" className="py-24 bg-white dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Başlık Bölümü */}
        <FadeIn delay={100}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
              {t.courses.title} <span className="text-indigo-600 dark:text-indigo-400">{t.courses.titleHighlight}</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
              {t.courses.desc}
            </p>
          </div>
        </FadeIn>

        {/* Kurs Kartları Izgarası */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {courses.map((course, index) => (
            <FadeIn key={course.id} delay={index * 150} direction="up">
              <div className="bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 group flex flex-col h-full hover:border-indigo-500/50 transition-all duration-500 transform hover:-translate-y-2">
                
                {/* Görsel Alanı */}
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={course.image} 
                    alt={course.title} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <span className="text-white text-sm font-bold flex items-center gap-2">
                      <Zap size={16} className="text-yellow-400 fill-yellow-400" /> 
                      {lang === 'tr' ? 'Hemen Öğrenmeye Başla' : 'Start Learning Now'}
                    </span>
                  </div>
                  <div className={`absolute top-5 right-5 backdrop-blur-md px-4 py-1.5 rounded-xl text-xs font-black shadow-lg ${getCategoryStyles(course.category)}`}>
                    {course.level}
                  </div>
                </div>

                {/* İçerik Alanı */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={16} 
                          fill={i < Math.floor(course.rating) ? "currentColor" : "none"} 
                          className={i < Math.floor(course.rating) ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-bold ml-1">{course.rating}</span>
                  </div>

                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {course.title}
                  </h3>

                  <div className="flex items-center gap-5 text-sm text-gray-500 dark:text-gray-400 mb-8 font-semibold">
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg">
                      <BookOpen size={16} className="text-indigo-500" />
                      {course.lessons}
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg">
                      <Users size={16} className="text-blue-500" />
                      {course.students}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-end pt-6 border-t border-gray-50 dark:border-gray-800">
                    <button className="bg-gray-900 dark:bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-lg group-hover:shadow-indigo-200 dark:shadow-none">
                      <ArrowRight size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
        
        {/* Doktora ve Araştırma Odaklı Modüller */}
        <FadeIn delay={400}>
          <div className="mt-16 rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-8 md:p-10">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400 mb-4">
                {lang === 'tr' ? 'Doktora ve Araştırma Katmanı' : 'Doctoral and Research Layer'}
              </p>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                {lang === 'tr'
                  ? 'İleri akademik matematik için seminer, makale ve ispat odaklı çalışma alanları'
                  : 'Seminar, paper, and proof-focused study spaces for advanced academic mathematics'}
              </h3>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-10">
              {researchModules.map((item) => (
                <div key={item.title} className="rounded-[1.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-4">
                    <ArrowRight size={18} />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">{item.title}</h4>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Courses;