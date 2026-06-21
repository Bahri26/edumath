import React from 'react';
import { Sparkles, TrendingUp, Sigma } from 'lucide-react';
import { COURSE_VISUALS } from '../../data/coursesData';

const ICONS = {
  sparkles: Sparkles,
  trending: TrendingUp,
  sigma: Sigma,
};

export default function CourseCardVisual({ category, title, lang = 'tr' }) {
  const visual = COURSE_VISUALS[category] || COURSE_VISUALS.primary;
  const Icon = ICONS[visual.icon] || Sparkles;

  return (
    <div
      className={`relative h-full w-full bg-gradient-to-br ${visual.gradient} flex flex-col items-center justify-center overflow-hidden`}
      role="img"
      aria-label={title}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden
      />
      <p className="absolute top-4 left-4 right-4 text-white/90 text-xs font-black tracking-widest uppercase truncate">
        {title}
      </p>
      <div className="relative z-10 flex flex-col items-center gap-3 p-6">
        <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Icon size={32} className="text-white" strokeWidth={2.2} aria-hidden />
        </div>
        <p className="text-white/90 font-mono text-sm font-bold tracking-wider">{visual.pattern}</p>
      </div>
      <span className="absolute bottom-4 text-white/70 text-[10px] font-semibold uppercase tracking-wider">
        {lang === 'tr' ? 'Örüntü modülü' : 'Pattern module'}
      </span>
    </div>
  );
}
