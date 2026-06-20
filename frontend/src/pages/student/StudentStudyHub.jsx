import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Play, Trophy, CheckCircle2 } from 'lucide-react';
import apiClient from '../../services/api';
import StudentPageShell from '../../components/student/StudentPageShell.jsx';
import WeakTopicsInsightCard from '../../components/student/WeakTopicsInsightCard.jsx';
import SkeletonCard from '../../components/ui/SkeletonCard.jsx';
import Button from '../../components/ui/Button.jsx';

export default function StudentStudyHub() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/exercises/student/my-exercises', {
          params: { page: 1, limit: 50 },
        });
        const rows = res.data?.data ?? res.data ?? [];
        if (!cancelled) setExercises(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setExercises([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <StudentPageShell
      title="Çalışma Merkezi"
      subtitle="Öğretmeninin hazırladığı egzersizler ve kişisel çalışma önerileri"
      maxWidthClass="max-w-4xl"
    >
      <div className="mb-8">
        <WeakTopicsInsightCard
          compact
          showPractice
          onGoHub={() => navigate('/student/courses')}
        />
      </div>

      <section className="mb-10">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Trophy size={22} className="text-amber-500" />
            Egzersizlerim
          </h2>
          <Link to="/student/quizzes" className="text-sm font-semibold text-indigo-600 hover:underline">
            Sınavlara git →
          </Link>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : exercises.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-10 text-center bg-white/80 dark:bg-slate-800/50">
            <p className="font-bold text-slate-800 dark:text-white">Henüz egzersiz yok</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Öğretmenin sınıfına egzersiz eklediğinde burada görünecek.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/student/courses')}>
              Derslere git
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {exercises.map((ex) => {
              const done = ex.studentProgress?.status === 'completed';
              const score = ex.studentProgress?.score;
              const count = ex.questionCount ?? ex.totalQuestions ?? 0;
              return (
                <div
                  key={ex._id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{ex.name}</h3>
                      {ex.description ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{ex.description}</p>
                      ) : null}
                    </div>
                    {done ? (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                        <CheckCircle2 size={14} /> %{score}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700">{ex.classLevel}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700">{count} soru</span>
                    {ex.timeLimit ? (
                      <span className="px-2 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 inline-flex items-center gap-1">
                        <Clock size={12} /> {ex.timeLimit} dk
                      </span>
                    ) : null}
                    {ex.topic ? (
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 truncate max-w-full">
                        {ex.topic}
                      </span>
                    ) : null}
                  </div>
                  <Link
                    to={`/student/exercises/${ex._id}`}
                    className="mt-auto inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:brightness-105 px-4 py-2.5"
                  >
                    <Play size={18} />
                    {done ? 'Tekrar çöz' : 'Başla'}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-sky-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 p-6">
          <BookOpen size={28} className="text-indigo-600 mb-3" />
          <h3 className="font-bold text-slate-800 dark:text-white">Ders quizleri</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 mb-4">
            Konu anlatımından sonra mini quiz çöz; yanlışta ipucu al.
          </p>
          <Link
            to="/student/courses"
            className="inline-flex min-h-[44px] items-center px-5 py-2 rounded-xl font-bold bg-sky-500 text-white hover:brightness-105"
          >
            Derslere git
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 p-6 opacity-80">
          <p className="text-xs font-bold uppercase text-slate-400 mb-2">Yakında</p>
          <h3 className="font-bold text-slate-700 dark:text-slate-300">Flashcard & oyunlar</h3>
          <p className="text-sm text-slate-500 mt-1">Kavram kartları ve eğitsel oyun modülleri üzerinde çalışılıyor.</p>
        </div>
      </section>
    </StudentPageShell>
  );
}
