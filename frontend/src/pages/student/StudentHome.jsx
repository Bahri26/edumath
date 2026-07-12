import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, BookOpen, CircleHelp, Play, Star, Dumbbell, ArrowRight, Flame } from 'lucide-react';
import { studentProfile as staticProfile } from '../../data/studentData';
import CourseCard from '../../components/ui/CourseCard';
import StudentPageShell from '../../components/student/StudentPageShell.jsx';
import { LanguageContext } from '../../context/LanguageContext';
import apiClient from '../../services/api';
import GuideDrawer from '../../components/help/GuideDrawer.jsx';
import { fetchStudentTopicCourses } from '../../utils/studentCourseData';
import WeakTopicsInsightCard from '../../components/student/WeakTopicsInsightCard.jsx';

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
const WEEKLY_XP_FALLBACK = 100;

const StudentHome = () => {
  const navigate = useNavigate();
  const { language } = useContext(LanguageContext);
  const [profile, setProfile] = useState(staticProfile);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [continueLearning, setContinueLearning] = useState({ course: '', topic: '', lessonId: null, progress: 0 });
  const [assignments, setAssignments] = useState([]);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [todayXpUtc, setTodayXpUtc] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [weekXp, setWeekXp] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(WEEKLY_XP_FALLBACK);
  const [examsForClass, setExamsForClass] = useState([]);
  const [exercisesForClass, setExercisesForClass] = useState([]);

  const formatDue = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isEn = language === 'EN';
    if (date.toDateString() === today.toDateString()) return isEn ? 'Today' : 'Bugün';
    if (date.toDateString() === tomorrow.toDateString()) return isEn ? 'Tomorrow' : 'Yarın';
    return date.toLocaleDateString(isEn ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
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
        if (!cancelled) setAssignments([]);
      }
    };
    loadAssignments();
    return () => {
      cancelled = true;
    };
  }, [language]);

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
        setStreakDays(Number(trendPayload?.streak ?? 0));
        const computedWeek =
          Number(trendPayload?.weekXp) ||
          (Array.isArray(days)
            ? days.slice(-7).reduce((sum, d) => sum + Number(d.xp || 0), 0)
            : 0);
        setWeekXp(computedWeek);
        setWeeklyGoal(Number(trendPayload?.weeklyGoal) > 0 ? Number(trendPayload.weeklyGoal) : WEEKLY_XP_FALLBACK);
      } catch {
        if (!cancelled) {
          setExamsForClass([]);
          setExercisesForClass([]);
          setTodayXpUtc(0);
          setStreakDays(0);
          setWeekXp(0);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Öğrenci profili + sınıf konuları (gerçek veri)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCoursesLoading(true);
      try {
        const res = await apiClient.get('/users/profile');
        const p = res.data || staticProfile;
        if (cancelled) return;
        setProfile(p);
        const data = await fetchStudentTopicCourses(p);
        if (cancelled) return;
        setCourses(data.courses);
        setContinueLearning(data.continueLearning);
      } catch {
        if (!cancelled) {
          setProfile(staticProfile);
          setCourses([]);
          setContinueLearning({ course: '', topic: '', lessonId: null, progress: 0 });
        }
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
      kidTasksProgress: "{{done}} / {{total}} görev tamamlandı",
      guide: "Kullanım kılavuzu",
      progressToday: "Bugün {{xp}} XP",
      streakLabel: "{{n}} gün seri",
      streakFresh: "Seriyi başlat",
      weeklyGoalTitle: "Haftalık hedef",
      weeklyGoalSub: "{{cur}} / {{target}} XP",
      weeklyGoalDone: "Haftalık XP hedefin tamam!",
      kidMissionQuiz: "Sınavlar",
      kidMissionQuizHint: "Bilgini dene",
      kidMissionQuizHintOpen: "{{n}} sınav açık",
      kidPracticePendingHint: "{{n}} egzersiz bekliyor",
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
      goalNavExercise: "Çalışmalara git",
      goalNavQuiz: "Sınava git",
      goalDoneBadge: "Tamam",
      kidContinueFallback: "Derslerinden devam et",
      coursesEmptyTitle: "Konuların hazırlanıyor",
      coursesEmptyHint: "Öğretmenin eklediği konular burada görünecek.",
      goCourses: "Derslerime Git",
      nowDoTitle: "Şimdi yap",
      nowDoCta: "Başla",
      nowDoAssignment: "Yaklaşan ödevin var",
      nowDoExam: "{{n}} sınav seni bekliyor",
      nowDoExercise: "{{n}} egzersiz tamamlanmayı bekliyor",
      nowDoContinue: "Kaldığın yerden devam et",
      nowDoFallback: "Çalışma merkezinden pratik yap",
      seeAllCourses: "Tüm dersler",
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
      kidTasksProgress: "{{done}} / {{total}} tasks done",
      guide: "User guide",
      progressToday: "Today {{xp}} XP",
      streakLabel: "{{n}}-day streak",
      streakFresh: "Start a streak",
      weeklyGoalTitle: "Weekly goal",
      weeklyGoalSub: "{{cur}} / {{target}} XP",
      weeklyGoalDone: "Weekly XP goal done!",
      kidMissionQuiz: "Quizzes",
      kidMissionQuizHint: "Try what you learned",
      kidMissionQuizHintOpen: "{{n}} quiz available",
      kidPracticePendingHint: "{{n}} practice(s) waiting",
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
      goalNavExercise: "Study hub",
      goalNavQuiz: "Quizzes",
      goalDoneBadge: "Done",
      kidContinueFallback: "Continue from your courses",
      coursesEmptyTitle: "Topics are on the way",
      coursesEmptyHint: "Your teacher's topics will show here.",
      goCourses: "Go to my courses",
      nowDoTitle: "Do this next",
      nowDoCta: "Start",
      nowDoAssignment: "You have an upcoming assignment",
      nowDoExam: "{{n}} quiz(zes) waiting",
      nowDoExercise: "{{n}} practice(s) still open",
      nowDoContinue: "Pick up where you left off",
      nowDoFallback: "Practice in the study hub",
      seeAllCourses: "All courses",
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
    const prog = ex.studentProgress;
    return !prog || prog.status !== 'completed';
  }).length;

  const openExamCount = examsForClass.filter(
    (ex) => !(ex.results || []).some((r) => String(r.studentId) === String(uid))
  ).length;

  const exerciseCompletedToday =
    exercisesForClass.some((ex) => {
      const prog = ex.studentProgress;
      return prog?.status === 'completed' && sameUtcDay(prog.completedAt, utcKey);
    });

  const examCompletedToday =
    examsForClass.some((ex) =>
      (ex.results || []).some(
        (r) => String(r.studentId) === String(uid) && sameUtcDay(r.submittedAt, utcKey)
      )
    );

  const goalXpMet = todayXpUtc >= XP_GOAL_TODAY;
  const weekGoalMet = weekXp >= weeklyGoal;
  const weekPct = Math.min(100, Math.round((weekXp / Math.max(weeklyGoal, 1)) * 100));

  const continueCardHint =
    assignmentHint ||
    (incompleteExerciseCount > 0
      ? fill(getText('kidPracticePendingHint'), { n: incompleteExerciseCount })
      : null);

  const kidMissions = [
    {
      titleKey: 'continueLesson',
      path: continueLearning.lessonId ? `/student/lesson/${continueLearning.lessonId}` : '/student/courses',
      Icon: Play,
      accent: 'from-amber-400 to-orange-500',
      hintFromTopic: true,
    },
    { titleKey: 'kidMissionQuiz', hintKey: 'kidMissionQuizHint', path: '/student/quizzes', Icon: Star, accent: 'from-teal-400 to-emerald-500' },
    { titleKey: 'goalExercise', hintKey: 'goalExerciseSubTodo', path: '/student/exercises', Icon: Dumbbell, accent: 'from-sky-400 to-teal-500' },
  ];

  const missionSubtitle = (m) => {
    if (m.hintFromTopic) {
      return continueCardHint || continueLearning.topic || getText('kidContinueFallback');
    }
    if (m.path === '/student/quizzes') {
      return openExamCount > 0
        ? fill(getText('kidMissionQuizHintOpen'), { n: openExamCount })
        : getText(m.hintKey);
    }
    if (m.path === '/student/exercises') {
      return incompleteExerciseCount > 0
        ? fill(getText('kidPracticePendingHint'), { n: incompleteExerciseCount })
        : getText(m.hintKey);
    }
    return getText(m.hintKey);
  };

  const tasksDoneCount = [goalXpMet, exerciseCompletedToday, examCompletedToday].filter(Boolean).length;
  const tasksTotal = 3;

  const isMissionDone = (m) => {
    if (m.path === '/student/quizzes') return examCompletedToday;
    if (m.path === '/student/exercises') return exerciseCompletedToday;
    return false;
  };

  const primaryNext = useMemo(() => {
    if (firstPendingAssignment) {
      return {
        title: getText('nowDoAssignment'),
        detail: assignmentHint || firstPendingAssignment.title,
        path: '/student/assignments',
      };
    }
    if (openExamCount > 0) {
      return {
        title: fill(getText('nowDoExam'), { n: openExamCount }),
        detail: getText('kidMissionQuizHint'),
        path: '/student/quizzes',
      };
    }
    if (incompleteExerciseCount > 0) {
      return {
        title: fill(getText('nowDoExercise'), { n: incompleteExerciseCount }),
        detail: getText('goalExerciseSubTodo'),
        path: '/student/exercises',
      };
    }
    if (continueLearning.lessonId || continueLearning.topic) {
      return {
        title: getText('nowDoContinue'),
        detail: continueLearning.topic || getText('kidContinueFallback'),
        path: continueLearning.lessonId
          ? `/student/lesson/${continueLearning.lessonId}`
          : '/student/courses',
      };
    }
    return {
      title: getText('nowDoFallback'),
      detail: getText('kidBuddyLine'),
      path: '/student/exercises',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    language,
    firstPendingAssignment,
    assignmentHint,
    openExamCount,
    incompleteExerciseCount,
    continueLearning.lessonId,
    continueLearning.topic,
  ]);

  const firstName = profile.name?.split(' ')[0] || 'Öğrenci';

  return (
    <StudentPageShell
      title={`${getText('welcome')}, ${firstName}!`}
      subtitle={getText('kidBuddyLine')}
      headerAside={(
        <button
          type="button"
          onClick={() => setIsGuideOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl min-h-[44px] px-4 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 text-sm font-bold hover:bg-sky-50 dark:hover:bg-slate-700 shadow-sm"
        >
          <CircleHelp size={18} aria-hidden />
          {getText('guide')}
        </button>
      )}
    >
      <section
        aria-label={getText('nowDoTitle')}
        className="rounded-2xl border border-teal-200/80 dark:border-teal-800/50 bg-gradient-to-r from-teal-50 via-white to-sky-50 dark:from-teal-950/40 dark:via-slate-800 dark:to-slate-800 p-4 sm:p-5 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">
              {getText('nowDoTitle')}
            </p>
            <h2 className="font-display text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mt-1 truncate">
              {primaryNext.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
              {primaryNext.detail}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(primaryNext.path)}
            className="inline-flex items-center justify-center gap-2 shrink-0 min-h-[48px] px-6 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-sm"
          >
            {getText('nowDoCta')}
            <ArrowRight size={18} aria-hidden />
          </button>
        </div>
      </section>

      <section
        aria-label={getText('kidTodayTitle')}
        className="rounded-2xl border border-sky-200/70 dark:border-slate-600 bg-white/90 dark:bg-slate-800/90 shadow-sm p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">
            {getText('kidTodayTitle')}
          </h2>
          <span className="text-sm font-semibold text-teal-700 dark:text-teal-300">
            {fill(getText('kidTasksProgress'), { done: tasksDoneCount, total: tasksTotal })}
          </span>
        </div>
        <div
          className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mb-4"
          role="progressbar"
          aria-valuenow={tasksDoneCount}
          aria-valuemin={0}
          aria-valuemax={tasksTotal}
          aria-label={fill(getText('kidTasksProgress'), { done: tasksDoneCount, total: tasksTotal })}
        >
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-teal-500 transition-all duration-500"
            style={{ width: `${Math.round((tasksDoneCount / tasksTotal) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          {fill(getText('progressToday'), { xp: todayXpUtc })}
          {!goalXpMet && ` · ${fill(getText('goalXpSub'), { cur: todayXpUtc, target: XP_GOAL_TODAY })}`}
        </p>
        <div className="mb-4 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-800 dark:text-amber-200">
              <Flame size={16} className="text-amber-500" aria-hidden />
              {streakDays > 0
                ? fill(getText('streakLabel'), { n: streakDays })
                : getText('streakFresh')}
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {getText('weeklyGoalTitle')}
              {' · '}
              {weekGoalMet
                ? getText('weeklyGoalDone')
                : fill(getText('weeklyGoalSub'), { cur: weekXp, target: weeklyGoal })}
            </span>
          </div>
          <div
            className="h-2 rounded-full bg-white/80 dark:bg-slate-800 overflow-hidden"
            role="progressbar"
            aria-valuenow={weekXp}
            aria-valuemin={0}
            aria-valuemax={weeklyGoal}
            aria-label={fill(getText('weeklyGoalSub'), { cur: weekXp, target: weeklyGoal })}
          >
            <div
              className={`h-full transition-all duration-500 ${
                weekGoalMet ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-teal-500'
              }`}
              style={{ width: `${weekPct}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {kidMissions.map((m) => {
            const done = isMissionDone(m);
            const Icon = m.Icon;
            return (
              <button
                key={m.titleKey}
                type="button"
                onClick={() => navigate(m.path)}
                className={`relative text-left rounded-2xl min-h-[5rem] p-4 text-white shadow-md bg-gradient-to-br ${m.accent} hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-amber-200/80 dark:focus:ring-slate-500 transition-all active:scale-[0.98] ${done ? 'ring-2 ring-emerald-300/80' : ''}`}
              >
                {done && (
                  <span className="absolute top-3 right-3 inline-flex items-center justify-center rounded-full bg-white/25 p-1" aria-hidden>
                    <CheckCircle size={18} className="text-white" />
                  </span>
                )}
                <Icon size={22} className="mb-2 opacity-95" aria-hidden />
                <span className="font-bold text-base leading-tight block">{getText(m.titleKey)}</span>
                <span className="text-xs text-white/90 font-medium line-clamp-2 mt-1">{missionSubtitle(m)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen size={22} className="text-teal-600 dark:text-teal-400" aria-hidden />
              {getText('myCourses')}
            </h2>
            {courses.length > 2 ? (
              <button
                type="button"
                onClick={() => navigate('/student/courses')}
                className="text-sm font-bold text-teal-700 dark:text-teal-300 hover:underline"
              >
                {getText('seeAllCourses')}
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {coursesLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))
            ) : courses.length > 0 ? (
              courses.slice(0, 2).map((course) => (
                <CourseCard
                  key={course.id}
                  {...course}
                  onClick={() => navigate('/student/courses')}
                />
              ))
            ) : (
              <div className="sm:col-span-2 rounded-2xl border-2 border-dashed border-sky-200 dark:border-slate-600 p-8 text-center bg-white/70 dark:bg-slate-800/50">
                <p className="font-bold text-slate-800 dark:text-white">{getText('coursesEmptyTitle')}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{getText('coursesEmptyHint')}</p>
                <button
                  type="button"
                  onClick={() => navigate('/student/courses')}
                  className="mt-4 rounded-xl bg-teal-600 text-white px-5 py-2.5 text-sm font-bold hover:bg-teal-700 min-h-[44px]"
                >
                  {getText('goCourses')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <WeakTopicsInsightCard
            compact
            showPractice
            onGoHub={() => navigate('/student/exercises')}
          />
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-base text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <Clock size={18} className="text-orange-500" aria-hidden />
              {getText('upcomingTasks')}
            </h3>
            <div className="space-y-2">
              {assignments.filter((task) => !task.completed).slice(0, 3).length > 0 ? (
                assignments.filter((task) => !task.completed).slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => navigate('/student/assignments')}
                    className={`w-full text-left p-3 rounded-xl border-l-4 min-h-[44px] ${task.urgent ? 'border-l-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-l-teal-500 bg-slate-50 dark:bg-slate-700/50'} hover:bg-sky-50/80 dark:hover:bg-slate-600/50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400`}
                  >
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{task.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{task.due}</p>
                  </button>
                ))
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">{getText('noPendingTasks')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <GuideDrawer audience="student" open={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </StudentPageShell>
  );
};

export default StudentHome;