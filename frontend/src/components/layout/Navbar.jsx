import React, { useState, useEffect, useRef, useContext } from 'react';
import useClickOutside from '../../hooks/useClickOutside';
import { useNavigate } from 'react-router-dom';
import {
  Menu, X, Home, User, BookOpen, Mail, ChevronRight, GraduationCap,
  BrainCircuit, Moon, Sun, Globe, LogIn, Settings, FileText, UserCircle, LogOut,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import logoUrl from '../../assets/logo.png';
import NotificationDropdown from '../ui/NotificationDropdown.jsx';

const DropdownItem = ({ icon, label, onClick, variant = 'default' }) => {
  const IconComponent = icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors ${
        variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-surface-700 dark:text-surface-200'
      }`}
    >
      <IconComponent size={18} /> {label}
    </button>
  );
};

function LogoMark({ scrolled, onNavigateHome }) {
  const [failed, setFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onNavigateHome}
      className="flex-shrink-0 flex items-center cursor-pointer group text-left"
      aria-label="Matova ana sayfa"
    >
      {failed ? (
        <div
          className="h-10 w-10 rounded-xl bg-brand-600 text-white font-black text-lg flex items-center justify-center shadow-sm ring-2 ring-brand-500/30"
          aria-hidden
        >
          E
        </div>
      ) : (
        <img
          src={logoUrl}
          alt=""
          width={40}
          height={40}
          decoding="async"
          fetchPriority="high"
          className="h-10 w-10 rounded-xl object-contain bg-surface-50 dark:bg-surface-800 ring-1 ring-surface-200 dark:ring-surface-600 shadow-sm p-0.5"
          onError={() => setFailed(true)}
        />
      )}
      <span
        className={`ml-3 font-bold text-2xl tracking-tight ${scrolled ? 'text-surface-900 dark:text-white' : 'text-brand-900 dark:text-white'}`}
      >
        Mato<span className="text-brand-600 dark:text-brand-400">va</span>
      </span>
    </button>
  );
}

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

  useClickOutside(profileRef, () => setProfileOpen(false));

  const navLinks = [
    { name: t.nav.home, href: '#home', icon: <Home size={18} /> },
    { name: t.nav.about, href: '#about', icon: <User size={18} /> },
    { name: t.nav.courses, href: '#courses', icon: <BookOpen size={18} /> },
    { name: t.nav.curriculum, href: '#curriculum', icon: <BrainCircuit size={18} /> },
    { name: t.nav.contact, href: '#contact', icon: <Mail size={18} /> },
  ];

  const handleNavigation = (path) => {
    setProfileOpen(false);
    setIsOpen(false);
    if (user?.role === 'admin') {
      if (path === '/profile' || path === '/settings') {
        navigate('/admin/settings');
        return;
      }
      navigate('/admin');
      return;
    }
    const roleBase = user?.role === 'teacher' ? '/teacher' : '/student';
    navigate(`${roleBase}${path}`);
  };

  const goMessages = () => {
    setProfileOpen(false);
    setIsOpen(false);
    navigate('/student/messages');
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 dark:bg-surface-900/95 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <LogoMark scrolled={scrolled} onNavigateHome={() => navigate('/')} />

          <div className="hidden lg:flex items-center gap-6">
            <div className="flex gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 font-medium text-sm xl:text-base transition-colors duration-200 group ${
                    scrolled
                      ? 'text-surface-600 dark:text-surface-300 hover:text-brand-600'
                      : 'text-surface-700 dark:text-surface-200 hover:text-brand-600'
                  }`}
                >
                  <span className="text-brand-500/80 group-hover:text-brand-600 transition-transform group-hover:-translate-y-0.5">
                    {link.icon}
                  </span>
                  {link.name}
                </a>
              ))}
            </div>

            <div className="h-6 w-px bg-surface-300 dark:bg-surface-600 mx-2" />

            <button
              type="button"
              onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
              className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300"
              aria-label={lang === 'tr' ? 'Switch to English' : 'Türkçeye geç'}
              title={lang === 'tr' ? 'English' : 'Türkçe'}
            >
              <Globe size={20} aria-hidden />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300"
              aria-label={theme === 'dark' ? 'Aydınlık tema' : 'Karanlık tema'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {user ? (
              <div className="flex items-center gap-2 relative" ref={profileRef}>
                <NotificationDropdown />
                {user.role === 'student' && (
                  <button
                    type="button"
                    onClick={goMessages}
                    className="p-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    aria-label="Mesajlar"
                    title="Mesajlar"
                  >
                    <Mail size={22} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="bg-brand-600 text-white font-bold rounded-full w-9 h-9 flex items-center justify-center text-sm hover:ring-2 ring-brand-300 transition-all"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  aria-label="Hesap menüsü"
                >
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 top-full mt-3 w-52 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-xl z-50 py-2"
                    role="menu"
                  >
                    {user?.role === 'admin' && (
                      <DropdownItem icon={FileText} label="Admin Paneli" onClick={() => { setProfileOpen(false); navigate('/admin'); }} />
                    )}
                    <DropdownItem icon={UserCircle} label="Profilim" onClick={() => handleNavigation('/profile')} />
                    <DropdownItem icon={Settings} label="Ayarlar" onClick={() => handleNavigation('/settings')} />
                    <hr className="my-1 border-surface-100 dark:border-surface-700" />
                    <DropdownItem icon={LogOut} label="Çıkış Yap" variant="danger" onClick={() => { setProfileOpen(false); logout(); }} />
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onLoginClick}
                className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl hover:bg-brand-700 transition-all font-semibold shadow-md active:scale-95"
              >
                <LogIn size={18} /> Giriş Yap
              </button>
            )}
          </div>

          <div className="lg:hidden flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
              className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300"
              aria-label={lang === 'tr' ? 'Switch to English' : 'Türkçeye geç'}
              title={lang === 'tr' ? 'English' : 'Türkçe'}
            >
              <Globe size={20} aria-hidden />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300"
              aria-label={theme === 'dark' ? 'Aydınlık tema' : 'Karanlık tema'}
            >
              {theme === 'dark' ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
            </button>
            {user && (
              <>
                <div className="flex items-center scale-90 origin-right">
                  <NotificationDropdown />
                </div>
                {user.role === 'student' && (
                  <button
                    type="button"
                    onClick={goMessages}
                    className="p-2 text-surface-600 dark:text-surface-300"
                    aria-label="Mesajlar"
                  >
                    <Mail size={22} />
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-brand-600 dark:text-brand-400"
              aria-expanded={isOpen}
              aria-label={isOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`lg:hidden absolute top-full left-0 w-full bg-white dark:bg-surface-900 border-t border-surface-100 dark:border-surface-800 shadow-2xl transition-all duration-300 overflow-hidden ${
          isOpen ? 'max-h-[90vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-800 border border-transparent hover:border-brand-200 dark:hover:border-brand-800 transition-all"
            >
              <div className="bg-white dark:bg-surface-700 p-2 rounded-lg text-brand-600 shadow-sm">{link.icon}</div>
              <span className="font-semibold text-surface-700 dark:text-surface-200">{link.name}</span>
              <ChevronRight size={18} className="ml-auto text-surface-400" />
            </a>
          ))}

          <div className="pt-4 border-t dark:border-surface-800">
            {user ? (
              <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold dark:text-white">{user.name}</span>
                </div>
                {user.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full text-left p-2 text-surface-600 dark:text-surface-300 font-medium"
                  >
                    Admin paneli
                  </button>
                )}
                <button type="button" onClick={() => handleNavigation('/profile')} className="w-full text-left p-2 text-surface-600 dark:text-surface-300">
                  Profilim
                </button>
                {user.role === 'student' && (
                  <button type="button" onClick={goMessages} className="w-full text-left p-2 text-surface-600 dark:text-surface-300">
                    Mesajlar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleNavigation('/settings')}
                  className="w-full text-left p-2 text-surface-600 dark:text-surface-300"
                >
                  Ayarlar
                </button>
                <button type="button" onClick={() => { setIsOpen(false); logout(); }} className="w-full text-left p-2 text-red-500 font-medium">
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <button type="button" onClick={onLoginClick} className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold shadow-lg">
                Giriş Yap
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
