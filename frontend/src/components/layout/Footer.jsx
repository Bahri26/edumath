import React from 'react';
import { Phone, MapPin, Mail, ChevronRight } from 'lucide-react';
import MatovaMark from '../ui/MatovaMark.jsx';

const Footer = ({ t }) => {
  const currentYear = new Date().getFullYear();
  const email = t.contact.email;

  const legalPath = (docType) => `/legal/${docType}`;

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 pt-16 pb-8 border-t border-gray-800 dark:border-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          <div>
            <div className="flex items-center text-white mb-4 gap-2">
              <MatovaMark size={28} className="rounded-lg shadow-sm" />
              <span className="text-xl font-bold">
                Mato<span className="text-teal-400">va</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6 text-gray-400">
              {t.footer.desc}
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">{t.footer.quickLinks}</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#home" className="hover:text-teal-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> {t.nav.home}</a></li>
              <li><a href="#about" className="hover:text-teal-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> {t.nav.about}</a></li>
              <li><a href="#courses" className="hover:text-teal-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> {t.nav.courses}</a></li>
              <li><a href="#curriculum" className="hover:text-teal-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> {t.nav.curriculum}</a></li>
              <li><a href="#contact" className="hover:text-teal-400 transition-colors flex items-center gap-2"><ChevronRight size={14} /> {t.nav.contact}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">{t.footer.popularCourses}</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#curriculum" className="hover:text-teal-400 transition-colors">{t.footer.schoolTrack}</a></li>
              <li><a href="#courses" className="hover:text-teal-400 transition-colors">{t.footer.researchTrack}</a></li>
              <li><a href="#contact" className="hover:text-teal-400 transition-colors">{t.footer.demoTrack}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">{t.footer.contact}</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 text-teal-500 shrink-0" size={18} />
                <span>{t.contact.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-teal-500 shrink-0" size={18} />
                <span>{t.contact.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="text-teal-500 shrink-0" size={18} />
                <a href={`mailto:${email}`} className="hover:text-teal-400 transition-colors">
                  {email}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 dark:border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-4">
          <p>&copy; {currentYear} Matova. {t.footer.rights}</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href={legalPath('privacy')} className="hover:text-white transition-colors">
              {t.footer.privacy}
            </a>
            <a href={legalPath('terms')} className="hover:text-white transition-colors">
              {t.footer.terms}
            </a>
            <a href={legalPath('cookies')} className="hover:text-white transition-colors">
              {t.footer.cookies}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
