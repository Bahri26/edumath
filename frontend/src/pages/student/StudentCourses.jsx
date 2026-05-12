import React, { useContext } from 'react';
import { Search } from 'lucide-react';
import { myCourses } from '../../data/studentData';
import CourseCard from '../../components/ui/CourseCard';
import { LanguageContext } from '../../context/LanguageContext';
import StudentPageShell from '../../components/student/StudentPageShell.jsx';

const StudentCourses = () => {
  const { language } = useContext(LanguageContext);

  // --- DİL ÇEVIRILERI ---
  const t = {
    TR: {
      allMyCourses: "Tüm Derslerim",
      searchCourses: "Ders ara...",
      discoverNewCourse: "Yeni Ders Keşfet",
    },
    EN: {
      allMyCourses: "All My Courses",
      searchCourses: "Search courses...",
      discoverNewCourse: "Discover New Course",
    }
  };

  const getText = (key) => t[language]?.[key] || t.TR[key];
  return (
    <StudentPageShell
      title={getText('allMyCourses')}
      headerAside={(
        <div className="relative w-full sm:w-auto min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder={getText('searchCourses')} className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-sky-200 dark:border-slate-600 bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]" />
        </div>
      )}
    >
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {myCourses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
          
          <div className="border-2 border-dashed border-sky-300/80 dark:border-slate-600 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-500 dark:text-slate-400 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition-colors min-h-[200px] bg-white/50 dark:bg-slate-800/40">
             <div className="bg-amber-100/80 dark:bg-slate-700 p-4 rounded-full mb-3"><Search size={24}/></div>
             <span className="font-semibold">{getText('discoverNewCourse')}</span>
          </div>
       </div>
    </StudentPageShell>
  );
};

export default StudentCourses;