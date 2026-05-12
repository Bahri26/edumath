import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Target, CheckCircle, Clock, BookOpen, CircleHelp, Sparkles } from 'lucide-react';
import { studentProfile as staticProfile, continueLearning as staticContinue, myCourses as staticCourses, upcomingAssignments as staticAssignments } from '../../data/studentData';
import ProgressPanel from '../../components/ui/ProgressPanel';
import CourseCard from '../../components/ui/CourseCard';
import { LanguageContext } from '../../context/LanguageContext';
import apiClient from '../../services/api';
import GuideDrawer from '../../components/help/GuideDrawer.jsx';

function readStoredUserId() {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u._id || u.id || '';
  } catch {
    return '';
  }
}

const sameUtcDay = (d, utcKey) => {
  if (!d) return false;
  const iso = typeof d === 'string' ? d : new Date(d).toISOString();
  return iso.slice(0, 10) === utcKey;
};

const XP_GOAL_TODAY = 25;

const StudentHome = () => {
  const navigate = useNavigate();
  const { language } = useContext(LanguageContext);
  const [profile, setProfile] = useState(staticProfile);
  const [courses, setCourses] = useState(staticCourses);
  const [continueLearning, setContinueLearning] = useState(staticContinue);
  const [assignments, setAssignments] = useState(staticAssignments);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [todayXpUtc, setTodayXpUtc] = useState(0);
  const [examsForClass, setExamsForClass] = useState([]);
  const [exercisesForClass, setExercisesForClass] = useState([]);

  const formatDue = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return 'Bugün';
    if (date.toDateString() === tomorrow.toDateString()) return 'Yarın';
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isDueUrgent = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date <= tomorrow;
  };

  const normalizeApiAssignments = (rows) =>
    rows.map((task) => ({
      id: task._id || task.id,
      title: task.title || 'Ödev',
      due: formatDue(task.dueDate),
      urgent: isDueUrgent(task.dueDate),
      rawDue: task.dueDate,
      completed: !!task.completed,
    }));

  // Yaklaşan ödevleri API'den çek
  useEffect(() => {
    let cancelled = false;
    const loadAssignments = async () => {
      try {
        const res = await apiClient.get('/assignments/student/my-assignments', {
          params: { page: 1, limit: 20 },
        });
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        if (cancelled) return;
        const norm = normalizeApiAssignments(rows);
        const pending = norm.filter((t) => !t.completed).sort((a, b) => {
          const ta = a.rawDue ? new Date(a.rawDue).getTime() : Infinity;
          const tb = b.rawDue ? new Date(b.rawDue).getTime() : Infinity;
          return ta - tb;
        });
        setAssignments(pending.length ? pending : []);
      } catch {
        if (!cancelled) setAssignments(staticAssignments);
      }
    };
    loadAssignments();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sınavlar, egzersizler, bugün XP (trend) — ana sayfa özetleri
  useEffect(() => {
    let cancelled = false;
    const utcKey = new Date().toISOString().slice(0, 10);
    const load = async () => {
      try {
        const [examsRes, exRes, trendsRes] = await Promise.all([
          apiClient.get('/exams/by-class'),
          apiClient.get('/exercises/student/my-exercises', { params: { page: 1, limit: 60 } }),
          apiClient.get('/progress/trends', { params: { days: 14 } }),
        ]);
        if (cancelled) return;
        const examsPayload = examsRes?.data;
        setExamsForClass(Array.isArray(examsPayload) ? examsPayload : []);

        const exPayload = exRes?.data?.data ?? exRes?.data;
        setExercisesForClass(Array.isArray(exPayload) ? exPayload : []);

        const trendPayload = trendsRes?.data?.data ?? trendsRes?.data;
        const days = trendPayload?.days || [];
        const todayEntry = Array.isArray(days) ? days.find((d) => d.day === utcKey) : null;
        setTodayXpUtc(Number(todayEntry?.xp ?? 0));
      } catch {
        if (!cancelled) {
          setExamsForClass([]);
          setExercisesForClass([]);
          setTodayXpUtc(0);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Öğrenci profilini backend'den çek
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/users/profile');
        setProfile(res.data);
        // Sınıfa göre ders ve ödev örüntüsü belirle
        if (res.data.grade) {
          // Örnek: 9. sınıf için matematik ve fen ağırlıklı, 12. sınıf için TYT/AYT ağırlıklı
          if (res.data.grade.includes('9')) {
            setCourses(staticCourses.filter(c => c.title.includes('Matematik') || c.title.includes('Geometri')));
            setContinueLearning({ ...staticContinue, course: '9. Sınıf Matematik', topic: 'Çarpanlar ve Katlar' });
          } else if (res.data.grade.includes('12')) {
            setCourses(staticCourses.filter(c => c.title.includes('TYT') || c.title.includes('AYT')));
            setContinueLearning({ ...staticContinue, course: 'AYT Matematik', topic: 'Türev ve İntegral' });
          } else {
            setCourses(staticCourses);
            setContinueLearning(staticContinue);
          }
        }
      } catch {
        setProfile(staticProfile);
        setCourses(staticCourses);
        setContinueLearning(staticContinue);
      }
    };
    fetchProfile();
  }, []);

  // --- DİL ÇEVIRILERI ---
  const t = {
    TR: {
      welcome: "Tekrar hoş geldin",
      continueLesson: "Derse Devam Et",
      lastTopic: "Son Konu",
      myCourses: "Derslerim",
      upcomingTasks: "Yaklaşan Ödevler",
      noPendingTasks: "Henüz yaklaşan ödev yok",
      kidBuddyLine: "Birlikte matematik macerasına devam edelim!",
      kidTodayTitle: "Bugünün görevleri",
      kidMissionAi: "AI antrenman",
      kidMissionAiHint: "Hızlı pratik",
      kidMissionQuiz: "Sınavlar",
      kidMissionQuizHint: "Bilgini dene",
      kidMissionQuizHintOpen: "{{n}} sınav açık",
      kidPracticePendingHint: "{{n}} egzersiz bekliyor",
      kidAiXpHint: "Bugün {{n}} XP",
      kidGoalsTitle: "Günlük Hedefler",
      goalXp: "Bugün XP topla",
      goalXpSub: "{{cur}} / {{target}} XP (UTC günlük kayıtlar)",
      goalXpDone: "Bugün için XP hedefin tamam!",
      goalExercise: "Egzersiz tamamla",
      goalExerciseSubDone: "Bugün bir çalışma bitirdin.",
      goalExerciseSubTodo: "Çalışma merkezinden başla",
      goalExam: "Sınav dene",
      goalExamSubDone: "Bugün bir sınav sonucun var.",
      goalExamSubTodo: "Sınıf sınavına katıl",
      goalNavPractice: "Antrenmana git",
      goalNavExercise: "Çalışmalara git",
      goalNavQuiz: "Sınava git",
      goalDoneBadge: "Tamam",
      kidContinueFallback: "Çalışma merkezinde devam et",
    },
    EN: {
      welcome: "Welcome Back",
      continueLesson: "Continue Lesson",
      lastTopic: "Last Topic",
      myCourses: "My Courses",
      upcomingTasks: "Upcoming Tasks",
      noPendingTasks: "No pending assignments",
      kidBuddyLine: "Let’s keep the math adventure going!",
      kidTodayTitle: "Today’s missions",
      kidMissionAi: "AI practice",
      kidMissionAiHint: "Quick practice",
      kidMissionQuiz: "Quizzes",
      kidMissionQuizHint: "Try what you learned",
      kidMissionQuizHintOpen: "{{n}} quiz available",
      kidPracticePendingHint: "{{n}} practice(s) waiting",
      kidAiXpHint: "{{n}} XP today",
      kidGoalsTitle: "Daily goals",
      goalXp: "Earn XP today",
      goalXpSub: "{{cur}} / {{target}} XP (daily log, UTC)",
      goalXpDone: "You hit today's XP goal!",
      goalExercise: "Finish a practice",
      goalExerciseSubDone: "You completed a practice today.",
      goalExerciseSubTodo: "Open the study hub",
      goalExam: "Take a quiz",
      goalExamSubDone: "You submitted a quiz today.",
      goalExamSubTodo: "Try a class quiz",
      goalNavPractice: "Go to practice",
      goalNavExercise: "Study hub",
      goalNavQuiz: "Quizzes",
      goalDoneBadge: "Done",
      kidContinueFallback: "Continue in the study hub",
    }
  };

  const fill = (str, vars) =>
    typeof str !== 'string'
      ? str
      : str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''));

  const getText = (key) => t[language]?.[key] || t.TR[key];

  const firstPendingAssignment = assignments.find((t) => !t.completed);
  const assignmentHint = firstPendingAssignment
    ? `${firstPendingAssignment.title}${firstPendingAssignment.due ? ` · ${firstPendingAssignment.due}` : ''}`
    : null;

  const uid = profile?._id || profile?.id || readStoredUserId();
  const utcKey = new Date().toISOString().slice(0, 10);

  const incompleteExerciseCount = exercisesForClass.filter((ex) => {
    const sub = (ex.submissions || []).find((s) => String(s.studentId) === String(uid));
    return !sub || sub.status !== 'completed';
  }).length;

  const openExamCount = examsForClass.filter(
    (ex) => !(ex.results || []).some((r) => String(r.studentId) === String(uid))
  ).length;

  const exerciseCompletedToday =
    exercisesForClass.some((ex) => {
      const sub = (ex.submissions || []).find((s) => String(s.studentId) === String(uid));
      return sub?.status === 'completed' && sameUtcDay(sub.completedAt, utcKey);
    });

  const examCompletedToday =
    examsForClass.some((ex) =>
      (ex.results || []).some(
        (r) => String(r.studentId) === String(uid) && sameUtcDay(r.submittedAt, utcKey)
      )
    );

  const goalXpMet = todayXpUtc >= XP_GOAL_TODAY;

  const continueCardHint =
    assignmentHint ||
    (incompleteExerciseCount > 0
      ? fill(getText('kidPracticePendingHint'), { n: incompleteExerciseCount })
      : null);

  const kidMissions = [
    {
      titleKey: 'continueLesson',
      path: '/student/exercises',
      emoji: '▶️',
      accent: 'from-amber-400 to-orange-500',
      hintFromTopic: true,
    },
    { titleKey: 'kidMissionAi', hintKey: 'kidMissionAiHint', path: '/student/practice', emoji: '🤖', accent: 'from-sky-400 to-indigo-500' },
    { titleKey: 'kidMissionQuiz', hintKey: 'kidMissionQuizHint', path: '/student/quizzes', emoji: '⭐', accent: 'from-teal-400 to-emerald-500' },
  ];

  const missionSubtitle = (m) => {
    if (m.hintFromTopic) {
      return continueCardHint || continueLearning.topic || getText('kidContinueFallback');
    }
    if (m.path === '/student/practice') {
      return todayXpUtc > 0 ? fill(getText('kidAiXpHint'), { n: todayXpUtc }) : getText(m.hintKey);
    }
    if (m.path === '/student/quizzes') {
      return openExamCount > 0
        ? fill(getText('kidMissionQuizHintOpen'), { n: openExamCount })
        : getText(m.hintKey);
    }
    return getText(m.hintKey);
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-10 text-[1.05rem]">
      <section
          aria-label={getText('kidTodayTitle')}
          className="rounded-[1.75rem] border border-sky-200/70 dark:border-slate-600 bg-white/85 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg shadow-sky-100/50 dark:shadow-none p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
            <div
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-sky-200 text-6xl shadow-inner dark:from-amber-500/40 dark:to-sky-600/40"
              aria-hidden
            >
              🧮
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-bold uppercase tracking-wide text-teal-600 dark:text-teal-300 flex items-center gap-2">
                <Sparkles className="shrink-0" size={18} aria-hidden />
                {getText('welcome')}, {profile.name?.split(' ')[0] || 'Öğrenci'}!
              </p>
              <p className="text-slate-700 dark:text-slate-200 font-medium leading-snug max-w-xl">
                {getText('kidBuddyLine')}
              </p>
            </div>
          </div>
          <h2 className="mt-8 mb-4 text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white">
            {getText('kidTodayTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {kidMissions.map((m) => (
              <button
                key={m.path}
                type="button"
                onClick={() => navigate(m.path)}
                className={`text-left rounded-2xl min-h-[5.25rem] p-5 text-white shadow-md bg-gradient-to-br ${m.accent} hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-amber-200/80 dark:focus:ring-slate-500 transition-all active:scale-[0.98]`}
              >
                <span className="text-2xl mb-2 block" aria-hidden>{m.emoji}</span>
                <span className="font-bold text-lg leading-tight block">{getText(m.titleKey)}</span>
                <span className="text-sm text-white/90 font-medium line-clamp-2">{missionSubtitle(m)}</span>
              </button>
            ))}
          </div>
      </section>

      <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl min-h-[3rem] px-5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-bold hover:bg-sky-50 dark:hover:bg-slate-700 shadow-sm"
          >
            <CircleHelp size={20} aria-hidden />
            Kullanım Kılavuzu
          </button>
          <div className="rounded-2xl min-h-[3rem] px-5 py-3 bg-white/80 dark:bg-slate-800/80 border border-teal-200/70 dark:border-slate-600 flex flex-col justify-center">
            <span className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase">{getText('lastTopic')}</span>
            <span className="font-semibold text-slate-800 dark:text-white">{continueLearning.topic}</span>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Derslerim (Sol Taraf) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen size={24} className="text-indigo-600 dark:text-indigo-400" />
              {getText("myCourses")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.slice(0, 4).map((course) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </div>
        </div>

        {/* 3. Hedefler & Yaklaşanlar (Sağ Taraf) + İlerleme Paneli */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
            <ProgressPanel days={14} />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
            <div className="flex items-center gap-3 mb-4">
                <Target className="text-rose-500" />
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{getText('kidGoalsTitle')}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/30 p-3">
                <div className={`p-2 rounded-full ${goalXpMet ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'}`}>
                  <Sparkles size={20} aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${goalXpMet ? 'text-emerald-700 dark:text-emerald-300 line-through decoration-emerald-500/50' : 'text-slate-800 dark:text-slate-100'}`}>
                    {getText('goalXp')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {goalXpMet ? getText('goalXpDone') : fill(getText('goalXpSub'), { cur: todayXpUtc, target: XP_GOAL_TODAY })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/student/practice')}
                  className="shrink-0 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 min-h-[40px]"
                >
                  {goalXpMet ? getText('goalDoneBadge') : getText('goalNavPractice')}
                </button>
              </div>
              <div className="flex items-start gap-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/30 p-3">
                <div className={`p-2 rounded-full ${exerciseCompletedToday ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'}`}>
                  <PlayCircle size={20} aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${exerciseCompletedToday ? 'text-emerald-700 dark:text-emerald-300 line-through decoration-emerald-500/50' : 'text-slate-800 dark:text-slate-100'}`}>
                    {getText('goalExercise')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {exerciseCompletedToday ? getText('goalExerciseSubDone') : getText('goalExerciseSubTodo')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/student/exercises')}
                  className="shrink-0 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl font-bold hover:bg-indigo-100 min-h-[40px]"
                >
                  {exerciseCompletedToday ? getText('goalDoneBadge') : getText('goalNavExercise')}
                </button>
              </div>
              <div className="flex items-start gap-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/30 p-3">
                <div className={`p-2 rounded-full ${examCompletedToday ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'}`}>
                  <CheckCircle size={20} aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${examCompletedToday ? 'text-emerald-700 dark:text-emerald-300 line-through decoration-emerald-500/50' : 'text-slate-800 dark:text-slate-100'}`}>
                    {getText('goalExam')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {examCompletedToday ? getText('goalExamSubDone') : getText('goalExamSubTodo')}
                    {examCompletedToday || openExamCount === 0 ? '' : ` (${openExamCount})`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/student/quizzes')}
                  className="shrink-0 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl font-bold hover:bg-indigo-100 min-h-[40px]"
                >
                  {examCompletedToday ? getText('goalDoneBadge') : getText('goalNavQuiz')}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={20} className="text-orange-500" />
              {getText("upcomingTasks")}
            </h3>
            <div className="space-y-3">
              {assignments.filter((t) => !t.completed).slice(0, 3).length > 0 ? (
                assignments.filter((t) => !t.completed).slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => navigate('/student/assignments')}
                    className={`w-full text-left p-3 rounded-xl border-l-4 ${task.urgent ? 'border-l-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-l-teal-500 bg-slate-50 dark:bg-slate-700/50'} hover:bg-sky-50/80 dark:hover:bg-slate-600/50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400`}
                  >
                    <div>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{task.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{task.due}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">{getText("noPendingTasks")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <GuideDrawer audience="student" open={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
};

export default StudentHome;