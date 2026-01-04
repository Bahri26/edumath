import React from 'react';
import { 
  GraduationCap, Phone, MapPin, Mail, ChevronRight, 
  Facebook, Twitter, Instagram, Linkedin 
} from 'lucide-react';

const Footer = ({ t }) => {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 pt-16 pb-8 border-t border-gray-800 dark:border-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <div>
            <div className="flex items-center text-white mb-4">
              <div className="bg-indigo-600 p-1.5 rounded-lg mr-2">
                <GraduationCap size={20} />
              </div>
              <span className="text-xl font-bold">Edu<span className="text-indigo-400">math</span></span>
            </div>
            <p className="text-sm leading-relaxed mb-6 text-gray-400">
              {t.footer.desc}
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">{t.footer.quickLinks}</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-indigo-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> {t.nav.home}</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> {t.nav.about}</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> {t.nav.courses}</a></li>
              <li><a href="#curriculum" className="hover:text-indigo-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> {t.nav.curriculum}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">{t.footer.popularCourses}</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">LGS Matematik</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">TYT-AYT Kampı</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Geometri 101</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">{t.footer.contact}</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 text-indigo-500 shrink-0" size={18} />
                <span>Teknoloji Vadisi, Eğitim Blokları No: 42</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-indigo-500 shrink-0" size={18} />
                <span>+90 (212) 555 00 00</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="text-indigo-500 shrink-0" size={18} />
                <span>info@edumath.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 dark:border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; 2024 Edumath. {t.footer.rights}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">{t.footer.privacy}</a>
            <a href="#" className="hover:text-white transition-colors">{t.footer.terms}</a>
            <a href="#" className="hover:text-white transition-colors">{t.footer.cookies}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;