import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Compass } from 'lucide-react';
import CourseCard from '../../components/ui/CourseCard';
import { LanguageContext } from '../../context/LanguageContext';
import apiClient from '../../services/api';
import StudentPageShell from '../../components/student/StudentPageShell.jsx';
import { fetchStudentTopicCourses, resolveClassLevel } from '../../utils/studentCourseData';

const StudentCourses = () => {
  const navigate = useNavigate();
  const { language } = useContext(LanguageContext);
  const [courses, setCourses] = useState([]);
  const [classLevel, setClassLevel] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const t = {
    TR: {
      allMyCourses: 'Tüm Derslerim',
      searchCourses: 'Konu ara…',
      discoverNewCourse: 'Çalışma Merkezine Git',
      subtitle: 'Sınıfına uygun matematik konuları — örüntüler dahil.',
      emptyTitle: 'Konular yükleniyor…',
      emptyReady: 'Henüz konu eklenmemiş',
      emptyHint: 'Öğretmenin konuları eklediğinde burada görünecek. Çalışma merkezinden pratik yapabilirsin!',
      patternSection: 'Örüntü konuları',
      otherSection: 'Diğer konular',
      statsCompleted: (n) => `${n} konu tamamlandı`,
      statsInProgress: (n) => `${n} konu devam ediyor`,
      motivate: 'Her küçük adım seni bir sonraki seviyeye taşır!',
    },
    EN: {
      allMyCourses: 'All My Courses',
      searchCourses: 'Search topics…',
      discoverNewCourse: 'Go to study hub',
      subtitle: 'Math topics for your grade — patterns included.',
      emptyTitle: 'Loading topics…',
      emptyReady: 'No topics yet',
      emptyHint: 'When your teacher adds topics they appear here. Try the study hub!',
      patternSection: 'Pattern topics',
      otherSection: 'Other topics',
      statsCompleted: (n) => `${n} topics completed`,
      statsInProgress: (n) => `${n} in progress`,
      motivate: 'Every small step levels you up!',
    },
  };

  const getText = (key) => t[language]?.[key] || t.TR[key];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const profileRes = await apiClient.get('/users/profile');
        const profile = profileRes.data || {};
        const data = await fetchStudentTopicCourses(profile);
        if (cancelled) return;
        setCourses(data.courses);
        setClassLevel(data.classLevel || resolveClassLevel(profile));
      } catch {
        if (!cancelled) setCourses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => String(c.title || '').toLowerCase().includes(q));
  }, [courses, search]);

  const patternCourses = filtered.filter((c) => c.isPattern);
  const otherCourses = filtered.filter((c) => !c.isPattern);
  const completedCount = courses.filter((c) => c.progress >= 100 && c.totalModules > 0).length;
  const inProgressCount = courses.filter((c) => c.progress > 0 && c.progress < 100).length;

  const goStudyHub = () => navigate('/student/exercises');

  const renderGrid = (list) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {list.map((course) => (
        <CourseCard
          key={course.id}
          {...course}
          onClick={() => goStudyHub()}
        />
      ))}
    </div>
  );

  return (
    <StudentPageShell
      title={getText('allMyCourses')}
      subtitle={`${classLevel ? `${classLevel} · ` : ''}${getText('subtitle')}`}
      headerAside={(
        <div className="relative w-full sm:w-auto min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={getText('searchCourses')}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-sky-200 dark:border-slate-600 bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
          />
        </div>
      )}
    >
      {!loading && courses.length > 0 && (
        <div className="mb-8 rounded-2xl border border-teal-200/70 dark:border-teal-900/40 bg-gradient-to-r from-teal-50/90 via-sky-50/80 to-amber-50/70 dark:from-teal-950/30 dark:via-slate-900/50 dark:to-amber-950/20 p-5 flex flex-wrap items-center gap-4">
          <Sparkles className="text-amber-500 shrink-0" size={28} />
          <div className="flex-1 min-w-[200px]">
            <p className="font-bold text-slate-800 dark:text-white">{getText('motivate')}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {getText('statsCompleted')(completedCount)} · {getText('statsInProgress')(inProgressCount)}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-6 rounded-3xl border-2 border-dashed border-sky-200 dark:border-slate-600 bg-white/60 dark:bg-slate-800/40">
          <Compass className="mx-auto text-teal-500 mb-4" size={40} />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{getText('emptyReady')}</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">{getText('emptyHint')}</p>
          <button
            type="button"
            onClick={goStudyHub}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-teal-600 text-white px-6 py-3 font-bold hover:bg-teal-700 transition-colors"
          >
            <Sparkles size={18} />
            {getText('discoverNewCourse')}
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {patternCourses.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-violet-700 dark:text-violet-300 mb-4 flex items-center gap-2">
                🧩 {getText('patternSection')}
              </h2>
              {renderGrid(patternCourses)}
            </section>
          )}
          {otherCourses.length > 0 && (
            <section>
              {patternCourses.length > 0 && (
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{getText('otherSection')}</h2>
              )}
              {renderGrid(otherCourses)}
            </section>
          )}
          <button
            type="button"
            onClick={goStudyHub}
            className="w-full sm:w-auto border-2 border-dashed border-sky-300/80 dark:border-slate-600 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-3 p-8 text-slate-600 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors bg-white/50 dark:bg-slate-800/40"
          >
            <div className="bg-amber-100/80 dark:bg-slate-700 p-4 rounded-full">
              <Search size={24} />
            </div>
            <span className="font-semibold text-lg">{getText('discoverNewCourse')}</span>
          </button>
        </div>
      )}
    </StudentPageShell>
  );
};

export default StudentCourses;
