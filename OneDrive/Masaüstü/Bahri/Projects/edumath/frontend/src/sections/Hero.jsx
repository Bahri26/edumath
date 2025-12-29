import React from 'react';
import FadeIn from '../components/ui/FadeIn';

const Hero = ({ t }) => {
  return (
    <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
      <FadeIn delay={0}>
        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold text-sm mb-6 animate-fade-in-up">
          {t.hero.badge}
        </div>
      </FadeIn>
      
      <FadeIn delay={100}>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
          {t.hero.titleStart} <span className="text-indigo-600 dark:text-indigo-400">{t.hero.titleHighlight}</span> {t.hero.titleEnd}
        </h1>
      </FadeIn>

      <FadeIn delay={200}>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
          {t.hero.desc}
        </p>
      </FadeIn>

      <FadeIn delay={300}>
        <div className="flex gap-4 justify-center">
          <button className="bg-indigo-600 dark:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-300 dark:shadow-none">
            {t.hero.btnStart}
          </button>
          <button className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-8 py-3 rounded-lg font-semibold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {t.hero.btnMore}
          </button>
        </div>
      </FadeIn>
    </section>
  );
};

export default Hero;