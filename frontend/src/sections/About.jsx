import React from 'react';
import { Star, Users, Clock, ArrowRight } from 'lucide-react';
import FadeIn from '../components/ui/FadeIn';

const About = ({ t }) => {
  return (
    <section id="about" className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-50 dark:bg-purple-900/20 rounded-full blur-3xl opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          
          <FadeIn direction="right">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transform transition-transform duration-500 group-hover:scale-[1.01]">
                <img 
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Edumath Classroom" 
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <p className="text-white font-medium text-lg">🎓 {t.about.statGrads}</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl hidden md:block animate-bounce-slow border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full text-green-600 dark:text-green-400">
                    <Star size={24} fill="currentColor" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 dark:text-white">4.9/5</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.about.statRating}</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn direction="left" delay={200}>
            <div className="space-y-8">
              <div>
                <h2 className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wide uppercase text-sm mb-2">{t.about.title}</h2>
                <h3 className="text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  {t.about.mainTitle} <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">{t.about.mainTitleHighlight}</span>
                </h3>
              </div>
              
              <div className="space-y-4 text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                <p>{t.about.desc1}</p>
                <p>{t.about.desc2}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="flex flex-col gap-2">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
                    <Users size={24} />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{t.about.featureStaff}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.about.featureStaffDesc}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2">
                    <Clock size={24} />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{t.about.featureAccess}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.about.featureAccessDesc}</p>
                </div>
              </div>

              <button className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group">
                {t.about.btnStory} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default About;