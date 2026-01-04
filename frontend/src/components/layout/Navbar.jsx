import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, Home, User, BookOpen, Mail, ChevronRight, GraduationCap, 
  BrainCircuit, Moon, Sun, Globe, LogIn, Settings, FileText, UserCircle, LogOut
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';


const Navbar = ({ lang, setLang, theme, toggleTheme, t, onLoginClick }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Menüden Ayarlar ve Anketler çıkarıldı
  const navLinks = [
    { name: t.nav.home, href: '#home', icon: <Home size={18} /> },
    { name: t.nav.about, href: '#about', icon: <User size={18} /> },
    { name: t.nav.courses, href: '#courses', icon: <BookOpen size={18} /> },
    { name: t.nav.curriculum, href: '#curriculum', icon: <BrainCircuit size={18} /> },
    { name: t.nav.contact, href: '#contact', icon: <Mail size={18} /> },
  ];

  // Profil dropdown dışına tıklanınca kapansın
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  const goProfile = () => {
    setProfileOpen(false);
    const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
    navigate(isTeacher ? '/teacher/profile' : '/student/profile');
  };

  const goSettings = () => {
    setProfileOpen(false);
    const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
    navigate(isTeacher ? '/teacher/settings' : '/student/settings');
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex-shrink-0 flex items-center cursor-pointer group">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white group-hover:bg-indigo-700 transition-colors shadow-sm">
              <GraduationCap size={26} />
            </div>
            <span className={`ml-3 font-bold text-2xl tracking-tight ${scrolled ? 'text-gray-900 dark:text-white' : 'text-indigo-900 dark:text-white'}`}>
              Edu<span className="text-indigo-600 dark:text-indigo-400">math</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex gap-6">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  className={`flex items-center gap-2 font-medium text-sm xl:text-base whitespace-nowrap transition-colors duration-200 group ${
                    scrolled ? 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400' : 'text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  <span className="group-hover:-translate-y-0.5 transition-transform duration-200 text-indigo-500/80 group-hover:text-indigo-600 dark:text-indigo-400">
                    {link.icon}
                  </span>
                  {link.name}
                </a>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative group"
                title={lang === 'tr' ? "Switch to English" : "Türkçeye Geç"}
              >
                <span>TR</span>
              </button>
              <button 
                onClick={toggleTheme} 
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Temayı Değiştir"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              {/* Kullanıcı Giriş Yaptıysa Profil, Değilse Login Butonu */}
              {user ? (
                // Profil Dropdown
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    <div className="flex flex-col items-end mr-2">
                      <span className="font-bold text-gray-800 dark:text-white text-sm">{user.name || 'Kullanıcı'}</span>
                    </div>
                    <div className="bg-purple-200 dark:bg-purple-700 text-purple-700 dark:text-purple-200 font-bold rounded-full w-8 h-8 flex items-center justify-center text-xs">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 py-2 animate-fade-in">
                      {user?.role === 'admin' && (
                        <button onClick={() => { setProfileOpen(false); navigate('/admin'); }} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-indigo-600 dark:text-indigo-400">
                          <FileText size={18} /> Admin Paneli
                        </button>
                      )}
                      <button onClick={goProfile} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200">
                        <UserCircle size={18} /> Profilim
                      </button>
                      <button onClick={goSettings} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200">
                        <Settings size={18} /> Ayarlar
                      </button>
                      <button 
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }} 
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-red-600 dark:text-red-400 w-full"
                      >
                        <LogOut size={18} /> Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Login Butonu
                <button
                  onClick={onLoginClick}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                >
                  <LogIn size={18} /> Giriş Yap
                </button>
              )}
            </div>
          </div>

          {/* Mobil Menü Butonu */}
          <div className="lg:hidden flex items-center gap-2">
            <button 
              onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Globe size={20} />
            </button>

            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-all duration-300 ml-1"
            >
              {isOpen ? <X size={30} /> : <Menu size={30} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobil Menü */}
      <div className={`lg:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-xl transition-all duration-300 ease-in-out origin-top ${isOpen ? 'opacity-100 scale-y-100 max-h-screen' : 'opacity-0 scale-y-0 max-h-0'}`}>
        <div className="px-4 pt-4 pb-8 space-y-3 flex flex-col max-h-[80vh] overflow-y-auto">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              onClick={() => setIsOpen(false)} 
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white dark:bg-gray-700 p-2 rounded-lg text-gray-400 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shadow-sm transition-colors">
                  {link.icon}
                </div>
                <span className="font-semibold text-lg">{link.name}</span>
              </div>
              <ChevronRight size={20} className="text-gray-300 dark:text-gray-500 group-hover:text-indigo-400" />
            </a>
          ))}
          <div className="pt-6 mt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-4">
            {/* Profil dropdown mobil */}
            {user ? (
              <div className="flex flex-col gap-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-purple-200 dark:bg-purple-700 text-purple-700 dark:text-purple-200 font-bold rounded-full w-10 h-10 flex items-center justify-center">
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 dark:text-white">{user.name || 'Kullanıcı'}</div>
                  </div>
                </div>
                <button onClick={() => { setIsOpen(false); goProfile(); }} className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200">
                  <UserCircle size={18} /> Profilim
                </button>
                <button onClick={() => { setIsOpen(false); goSettings(); }} className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200">
                  <Settings size={18} /> Ayarlar
                </button>
                <button 
                  onClick={() => { 
                    setIsOpen(false); 
                    logout();
                  }} 
                  className="flex items-center gap-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-red-600 dark:text-red-400 w-full"
                >
                  <LogOut size={18} /> Çıkış Yap
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLoginClick();
                }}
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold w-full"
              >
                <LogIn size={18} /> Giriş Yap
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;