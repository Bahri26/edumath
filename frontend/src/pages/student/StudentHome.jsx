import React, { useContext, useEffect, useState } from 'react';
import { PlayCircle, Target, CheckCircle, Clock, BookOpen, CircleHelp } from 'lucide-react';
import { studentProfile as staticProfile, continueLearning as staticContinue, myCourses as staticCourses, upcomingAssignments as staticAssignments } from '../../data/studentData';
import ProgressPanel from '../../components/ui/ProgressPanel';
import CourseCard from '../../components/ui/CourseCard';
import { LanguageContext } from '../../context/LanguageContext';
import apiClient from '../../services/api';
import GuideDrawer from '../../components/help/GuideDrawer.jsx';

const StudentHome = () => {
  const { language } = useContext(LanguageContext);
  const [profile, setProfile] = useState(staticProfile);
  const [grade, setGrade] = useState(staticProfile.grade || '');
  const [courses, setCourses] = useState(staticCourses);
  const [continueLearning, setContinueLearning] = useState(staticContinue);
  const [assignments, setAssignments] = useState(staticAssignments);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Öğrenci profilini backend'den çek
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/users/profile');
        setProfile(res.data);
        setGrade(res.data.grade || '');
        // Sınıfa göre ders ve ödev örüntüsü belirle
        if (res.data.grade) {
          // Örnek: 9. sınıf için matematik ve fen ağırlıklı, 12. sınıf için TYT/AYT ağırlıklı
          if (res.data.grade.includes('9')) {
            setCourses(staticCourses.filter(c => c.title.includes('Matematik') || c.title.includes('Geometri')));
            setAssignments(staticAssignments.filter(a => a.title.includes('Türev') || a.title.includes('Proje')));
            setContinueLearning({ ...staticContinue, course: '9. Sınıf Matematik', topic: 'Çarpanlar ve Katlar' });
          } else if (res.data.grade.includes('12')) {
            setCourses(staticCourses.filter(c => c.title.includes('TYT') || c.title.includes('AYT')));
            setAssignments(staticAssignments.filter(a => a.title.includes('Quiz') || a.title.includes('Proje')));
            setContinueLearning({ ...staticContinue, course: 'AYT Matematik', topic: 'Türev ve İntegral' });
          } else {
            setCourses(staticCourses);
            setAssignments(staticAssignments);
            setContinueLearning(staticContinue);
          }
        }
      } catch {
        setProfile(staticProfile);
        setGrade(staticProfile.grade || '');
        setCourses(staticCourses);
        setAssignments(staticAssignments);
        setContinueLearning(staticContinue);
      }
    };
    fetchProfile();
  }, []);

  // --- DİL ÇEVIRILERI ---
  const t = {
    TR: {
      welcome: "Tekrar Hoşgeldin",
      ready: "dersinde kaldığın yerden devam etmeye hazır mısın?",
      continueLesson: "Derse Devam Et",
      lastTopic: "Son Konu",
      myCourses: "Derslerim",
      upcomingTasks: "Yaklaşan Ödevler",
      noPendingTasks: "Henüz yaklaşan ödev yok",
    },
    EN: {
      welcome: "Welcome Back",
      ready: "are you ready to continue from where you left off?",
      continueLesson: "Continue Lesson",
      lastTopic: "Last Topic",
      myCourses: "My Courses",
      upcomingTasks: "Upcoming Tasks",
      noPendingTasks: "No pending assignments",
    }
  };

  const getText = (key) => t[language]?.[key] || t.TR[key];
  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-8">
      {/* 1. Hero / Karşılama Alanı */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-6 md:p-10 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl group-hover:opacity-10 transition-opacity"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{getText("welcome")}, {profile.name?.split(' ')[0] || 'Öğrenci'}! 👋</h1>
            <p className="text-indigo-100 opacity-90 mb-6 max-w-lg">
              {grade ? `${grade} için` : ''} Harika gidiyorsun! <span className="font-semibold text-yellow-300">{continueLearning.course}</span> {getText("ready")}
            </p>
            <button className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition-colors shadow-lg">
              <PlayCircle size={20} /> {getText("continueLesson")}
            </button>
            <button
              onClick={() => setIsGuideOpen(true)}
              className="mt-3 bg-white/10 border border-white/20 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/20 transition-colors"
            >
              <CircleHelp size={20} /> Kullanım Kılavuzu
            </button>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[280px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">{getText("lastTopic")}</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white">{continueLearning.timeLeft}</span>
            </div>
            <h3 className="font-bold text-lg mb-1">{continueLearning.topic}</h3>
            <div className="w-full bg-black/20 rounded-full h-1.5 mt-3">
              <div className="bg-green-400 h-full rounded-full" style={{ width: `${continueLearning.progress}%` }}></div>
            </div>
          </div>
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
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Günlük Hedefler</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-2 rounded-full"><CheckCircle size={20} /></div>
                <div className="flex-1">
                  <p className="font-medium text-slate-700 dark:text-slate-300 line-through decoration-slate-400">Giriş Yap</p>
                  <p className="text-xs text-slate-400">Tamamlandı • 50 XP</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 dark:bg-slate-700 text-slate-400 p-2 rounded-full border-2 border-slate-200 dark:border-slate-600 border-dashed"><PlayCircle size={20} /></div>
                <div className="flex-1">
                  <p className="font-medium text-slate-700 dark:text-slate-300">Bir test çöz</p>
                  <p className="text-xs text-slate-400">0/1 • 150 XP</p>
                </div>
                <button className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded font-bold">Başla</button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={20} className="text-orange-500" />
              {getText("upcomingTasks")}
            </h3>
            <div className="space-y-3">
              {assignments.slice(0, 3).length > 0 ? (
                assignments.slice(0, 3).map((task) => (
                  <div key={task.id} className={`p-3 rounded-xl border-l-4 ${task.urgent ? 'border-l-rose-500 bg-rose-50/50 dark:bg-rose-900/10' : 'border-l-indigo-500 bg-slate-50 dark:bg-slate-700/50'} flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors`}>
                    <div>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{task.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{task.due}</p>
                    </div>
                  </div>
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