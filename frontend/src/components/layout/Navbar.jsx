import React, { useState, useEffect, useRef, useContext } from 'react';
import useClickOutside from '../../hooks/useClickOutside';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, Home, User, BookOpen, Mail, ChevronRight, GraduationCap, 
  BrainCircuit, Moon, Sun, Globe, LogIn, Settings, FileText, UserCircle, LogOut, Bell
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

// --- Alt Bileşen: Dropdown Menu Item ---
const DropdownItem = ({ icon: Icon, label, onClick, variant = 'default' }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors ${
      variant === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'
    }`}
  >
    <Icon size={18} /> {label}
  </button>
);

const Navbar = ({ lang, setLang, theme, toggleTheme, t, onLoginClick }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Scroll takibi
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Custom hook kullanımı
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
    const rolePath = (user?.role === 'teacher' || user?.role === 'admin') ? '/teacher' : '/student';
    navigate(`${rolePath}${path}`);
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Bölümü */}
          <div onClick={() => navigate('/')} className="flex-shrink-0 flex items-center cursor-pointer group">
            <img src={logo} alt="Edumath Logo" className="h-10 w-10 rounded-xl bg-white shadow-sm p-1" />
            <span className={`ml-3 font-bold text-2xl tracking-tight ${scrolled ? 'text-gray-900 dark:text-white' : 'text-indigo-900 dark:text-white'}`}>
              Edu<span className="text-indigo-600 dark:text-indigo-400">math</span>
            </span>
          </div>

          {/* Desktop Navigasyon */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex gap-6">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  className={`flex items-center gap-2 font-medium text-sm xl:text-base transition-colors duration-200 group ${
                    scrolled ? 'text-gray-600 dark:text-gray-300 hover:text-indigo-600' : 'text-gray-700 dark:text-gray-200 hover:text-indigo-600'
                  }`}
                >
                  <span className="text-indigo-500/80 group-hover:text-indigo-600 transition-transform group-hover:-translate-y-0.5">
                    {link.icon}
                  </span>
                  {link.name}
                </a>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

            {/* Kullanıcı / Giriş Alanı */}
            {user ? (
              <div className="flex items-center gap-3 relative" ref={profileRef}>
                <NotificationDropdown icon={<Bell size={22} />} count={2} title="Bildirimler" />
                <NotificationDropdown icon={<Mail size={22} />} count={1} title="Mesajlar" />
                
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="bg-purple-600 text-white font-bold rounded-full w-9 h-9 flex items-center justify-center text-sm hover:ring-2 ring-purple-300 transition-all"
                >
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-3 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2">
                    {user?.role === 'admin' && (
                      <DropdownItem icon={FileText} label="Admin Paneli" onClick={() => { setProfileOpen(false); navigate('/admin'); }} />
                    )}
                    <DropdownItem icon={UserCircle} label="Profilim" onClick={() => handleNavigation('/profile')} />
                    <DropdownItem icon={Settings} label="Ayarlar" onClick={() => handleNavigation('/settings')} />
                    <hr className="my-1 border-gray-100 dark:border-gray-700" />
                    <DropdownItem icon={LogOut} label="Çıkış Yap" variant="danger" onClick={() => { setProfileOpen(false); logout(); }} />
                  </div>
                )}
              </div>
            ) : (
              <button onClick={onLoginClick} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-md active:scale-95">
                <LogIn size={18} /> Giriş Yap
              </button>
            )}
          </div>

          {/* Mobil Kontroller */}
          <div className="lg:hidden flex items-center gap-3">
            <button onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
              <Globe size={20} />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-indigo-600">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobil Menü Tasarımı */}
      <div className={`lg:hidden absolute top-full left-0 w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-2xl transition-all duration-300 overflow-hidden ${
        isOpen ? 'max-h-[90vh] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="p-4 space-y-3">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 transition-all"
            >
              <div className="bg-white dark:bg-gray-700 p-2 rounded-lg text-indigo-500 shadow-sm">{link.icon}</div>
              <span className="font-semibold text-gray-700 dark:text-gray-200">{link.name}</span>
              <ChevronRight size={18} className="ml-auto text-gray-400" />
            </a>
          ))}
          
          <div className="pt-4 border-t dark:border-gray-800">
            {user ? (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold dark:text-white">{user.name}</span>
                </div>
                <button onClick={() => handleNavigation('/profile')} className="w-full text-left p-2 text-gray-600 dark:text-gray-300">Profilim</button>
                <button onClick={logout} className="w-full text-left p-2 text-red-500 font-medium">Çıkış Yap</button>
              </div>
            ) : (
              <button onClick={onLoginClick} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg">Giriş Yap</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- Geliştirilmiş Bildirim/Mesaj Dropdown Bileşeni ---
function NotificationDropdown({ icon, count, title }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  useClickOutside(dropdownRef, () => setOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
      >
        {icon}
        {count > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white dark:border-gray-900">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 font-bold text-sm border-b dark:border-gray-700">
            {title}
          </div>
          <div className="max-h-60 overflow-y-auto">
            <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700">
              Henüz yeni bir {title.toLowerCase()} yok.
            </div>
          </div>
          <div className="p-2 text-center">
            <button className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Tümünü Gör</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;