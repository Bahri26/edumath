import React, { useContext } from 'react';
import { Search } from 'lucide-react';
import { myCourses } from '../../data/studentData';
import CourseCard from '../../components/ui/CourseCard';
import { LanguageContext } from '../../context/LanguageContext';

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
    <div className="animate-fade-in space-y-6">
       <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{getText('allMyCourses')}</h2>
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder={getText('searchCourses')} className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm focus:outline-indigo-500" />
         </div>
       </div>
       
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {myCourses.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
          
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-400 hover:border-indigo-500 hover:text-indigo-500 cursor-pointer transition-colors min-h-[200px]">
             <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-3"><Search size={24}/></div>
             <span className="font-semibold">{getText('discoverNewCourse')}</span>
          </div>
       </div>
    </div>
  );
};

export default StudentCourses;