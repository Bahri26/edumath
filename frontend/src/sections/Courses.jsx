import React from 'react';
import { Star, BookOpen, Users, ArrowRight } from 'lucide-react';
import FadeIn from '../components/ui/FadeIn';
import { getCourses } from '../data/coursesData';

const Courses = ({ lang, t }) => {
  const courses = getCourses(lang, t);

  return (
    <section id="courses" className="py-24 bg-gray-50 dark:bg-gray-950 mb-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn delay={100}>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t.courses.title} <span className="text-indigo-600 dark:text-indigo-400">{t.courses.titleHighlight}</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t.courses.desc}
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <FadeIn key={course.id} delay={index * 150} direction="up">
              <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-800 group flex flex-col h-full">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={course.image} 
                    alt={course.title} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-700 dark:text-indigo-400 shadow-sm">
                    {course.level}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" className={i < Math.floor(course.rating) ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">({course.rating})</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {course.title}
                  </h3>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <div className="flex items-center gap-1">
                      <BookOpen size={14} />
                      {course.lessons}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      {course.students}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{course.price}</span>
                    <button className="bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-colors">
                      {t.courses.btnReview}
                    </button>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
        
        <FadeIn delay={400}>
          <div className="text-center mt-12">
            <button className="inline-flex items-center gap-2 border-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 px-8 py-3 rounded-xl font-bold hover:bg-indigo-600 dark:hover:bg-indigo-400 hover:text-white dark:hover:text-gray-900 transition-all duration-300">
              {t.courses.btnAll} <ArrowRight size={20} />
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Courses;