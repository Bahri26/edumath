import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Puzzle, Layers, Brain } from 'lucide-react';
import StudentPageShell from '../../components/student/StudentPageShell.jsx';
import WeakTopicsInsightCard from '../../components/student/WeakTopicsInsightCard.jsx';

const studyTypes = [
  {
    icon: <BookOpen size={32} className="text-indigo-600" />,
    title: 'Quiz Çöz',
    desc: 'Sınıf seviyene uygun, otomatik veya öğretmenin hazırladığı testleri çöz.',
    action: { label: 'Quizlere Git', to: '/student/quizzes' },
  },
  {
    icon: <Layers size={32} className="text-emerald-600" />,
    title: 'Flashcard Çalış',
    desc: 'Kavramları ve formülleri hızlıca tekrar etmek için kartlarla çalış.',
    action: { label: 'Flashcard Modülü (Yakında)', to: '#' },
  },
  {
    icon: <Puzzle size={32} className="text-amber-500" />,
    title: 'Eğitsel Oyunlar',
    desc: 'Sınıfına uygun eğlenceli oyunlarla bilgini pekiştir.',
    action: { label: 'Oyunlar (Yakında)', to: '#' },
  },
];

export default function StudentStudyHub() {
  const navigate = useNavigate();

  return (
    <StudentPageShell
      title="Çalışma Merkezi"
      subtitle="Sınıf seviyene uygun farklı çalışma türleriyle kendini geliştir!"
      maxWidthClass="max-w-4xl"
    >
      <div className="mb-8">
        <WeakTopicsInsightCard
          compact
          showPractice
          onGoHub={() => navigate('/student/courses')}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-violet-50 to-sky-50 dark:from-violet-950/30 dark:to-slate-900/50 p-6 rounded-[1.25rem] border border-violet-200/60 dark:border-violet-900/40 flex flex-col sm:flex-row items-start gap-4">
          <Brain size={32} className="text-violet-600 shrink-0" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Kişisel çalışma önerileri</h2>
            <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Yukarıdaki kart, sınav ve çalışma geçmişine göre zayıf konularını listeler. Önerilen alıştırma
              butonu yerel soru bankasından soru seçer.
            </p>
          </div>
        </div>

        {studyTypes.map((type, i) => (
          <div
            key={i}
            className="bg-white/90 dark:bg-slate-800/90 p-6 rounded-[1.25rem] border border-sky-200/70 dark:border-slate-700 shadow-md flex flex-col items-start gap-4"
          >
            {type.icon}
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{type.title}</h2>
            <p className="text-slate-600 dark:text-slate-300 flex-1 leading-relaxed">{type.desc}</p>
            {type.action.to !== '#' ? (
              <Link
                to={type.action.to}
                className="mt-auto min-h-[44px] inline-flex items-center px-6 py-2.5 rounded-2xl font-bold bg-gradient-to-r from-sky-500 to-teal-500 text-white hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-sky-200/80 dark:focus:ring-slate-600"
              >
                {type.action.label}
              </Link>
            ) : (
              <span className="mt-auto min-h-[44px] inline-flex items-center px-6 py-2.5 rounded-2xl font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed">
                {type.action.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </StudentPageShell>
  );
}
