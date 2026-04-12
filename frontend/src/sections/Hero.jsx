import React from 'react';
import FadeIn from '../components/ui/FadeIn';

const Hero = ({ t, theme }) => {
  // Örüntü temasını vurgulayan dekoratif noktalar dizisi
  const patternDots = [1, 2, 3, 4, 5, 6];

  return (
    <section 
      id="home" 
      className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden"
    >
      {/* 1. ARKA PLAN: Matematiksel Nokta Örüntüsü (Grid) */}
      <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-20 pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-full h-full" 
          style={{ 
            backgroundImage: `radial-gradient(${theme === 'dark' ? '#6366f1' : '#4f46e5'} 1.5px, transparent 1.5px)`, 
            backgroundSize: '40px 40px' 
          }}
        />
      </div>

      {/* 2. ROZET (BADGE) */}
      <FadeIn delay={0}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs sm:text-sm mb-8 border border-indigo-100 dark:border-indigo-800 animate-bounce-slow">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          {t.hero.badge}
        </div>
      </FadeIn>
      
      {/* 3. ANA BAŞLIK (H1) */}
      <FadeIn delay={150}>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 leading-[1.1] tracking-tight">
          {t.hero.titleStart} 
          <span className="relative inline-block mx-2">
            <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
              {t.hero.titleHighlight}
            </span>
            {/* Vurgu çizgisi */}
            <span className="absolute bottom-2 left-0 w-full h-3 bg-indigo-100 dark:bg-indigo-900/40 -z-10 rounded-sm"></span>
          </span>
          <br className="hidden md:block" />
          {t.hero.titleEnd}
        </h1>
      </FadeIn>

      {/* 4. AÇIKLAMA METNİ */}
      <FadeIn delay={300}>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-4 max-w-3xl mx-auto leading-relaxed font-medium">
          {t.hero.desc}
        </p>
        <p className="text-base sm:text-lg text-indigo-700 dark:text-indigo-300 font-semibold mb-12 max-w-2xl mx-auto">
          Bu platform ilkokul, ortaokul ve lise düzeyindeki öğrenciler için hazırlanmıştır.
        </p>
      </FadeIn>

      {/* 5. AKSİYON BUTONLARI (CTA) */}
      <FadeIn delay={450}>
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full sm:w-auto">
          <button className="group relative w-full sm:w-auto bg-indigo-600 dark:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/20 flex items-center justify-center gap-2">
            {t.hero.btnStart}
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          
          <button className="w-full sm:w-auto bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-10 py-4 rounded-2xl font-bold text-lg border-2 border-gray-100 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
            {t.hero.btnMore}
          </button>
        </div>
      </FadeIn>

      {/* 6. GÖRSEL ÖRÜNTÜ DEKORASYONU (Alt Bölüm) */}
      <div className="mt-20 flex items-end justify-center gap-3 sm:gap-4 opacity-40 select-none">
        {patternDots.map((i) => (
          <div 
            key={i} 
            className="w-4 sm:w-6 bg-gradient-to-t from-indigo-500 to-violet-400 rounded-t-lg transition-all duration-1000 animate-pulse"
            style={{ 
              height: `${i * 12}px`, 
              animationDelay: `${i * 150}ms`,
              opacity: 0.2 + (i * 0.1)
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;