import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './common/Logo';
import AdminAlertBadge from './admin/AdminAlertBadge';
import { useTheme } from '../hooks/useTheme';

const Navbar = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const { theme, toggleTheme } = useTheme();

    // Kullanıcı bilgisini çek
    useEffect(() => {
        const storedUser = localStorage.getItem('edumath_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                setUser(null);
            }
        } else {
            setUser(null);
        }

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('edumath_user');
        navigate('/');
        window.location.reload(); // State'i sıfırlamak için sayfayı yenile
    };

    return (
        <nav className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50 transition-colors">
                <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center h-16 sm:h-20">
                {/* LOGO (Herkes tıklar) */}
                <div 
                    className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2 sm:gap-3 cursor-pointer group" 
                    onClick={() => navigate(user ? (user.role === 'admin' ? '/admin-dashboard' : user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard') : '/')}
                >
                    <Logo size="sm" className="transition-transform group-hover:scale-110" />
                    <span className="hidden sm:block">
                        <span className="bg-gradient-to-r from-indigo-600 to-orange-500 bg-clip-text text-transparent">Edu</span>
                        <span className="text-gray-800 dark:text-white">Math</span>
                    </span>
                </div>

                {/* ORTADA: Dark Mode Toggle + Admin Alert (if admin) */}
                <div className="flex items-center gap-2">
                    {user?.role === 'admin' && (
                        <AdminAlertBadge />
                    )}
                    <button 
                        onClick={toggleTheme}
                        className="p-2 sm:p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors group"
                        aria-label="Theme Toggle"
                    >
                        {theme === 'dark' ? (
                            <svg className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400 group-hover:rotate-45 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-4 sm:w-5 h-4 sm:h-5 text-slate-600 dark:text-slate-400 group-hover:-rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* SAĞ TARAF */}
            {user ? (
                // --- KULLANICI GİRİŞ YAPMIŞSA (Profil Menüsü) ---
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 sm:gap-3 hover:bg-gray-50 dark:hover:bg-slate-800 p-1 sm:p-2 rounded-lg transition-colors"
                    >
                        <div className="text-right hidden md:block leading-tight">
                            <div className="text-xs sm:text-sm font-bold text-gray-700 dark:text-white">{user.name || user.full_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {user.role === 'admin' ? 'Yönetici' : user.role === 'teacher' ? 'Öğretmen' : 'Öğrenci'}
                            </div>
                        </div>
                        <div className="w-8 sm:w-10 h-8 sm:h-10 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm sm:text-lg font-bold shadow-md ring-2 ring-orange-100">
                            {(user.name || user.full_name)?.charAt(0).toUpperCase()}
                        </div>
                    </button>

                    {/* AÇILIR MENÜ */}
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-3 w-56 sm:w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden py-2 animate-fade-in-down origin-top-right z-50">
                            {/* 1. Bölüm: İsim & Rol (Mobilde görünsün diye tekrar koyduk) */}
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50 block md:hidden">
                                <p className="text-sm font-bold text-gray-800 dark:text-white">{user.name || user.full_name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.role === 'admin' ? 'Yönetici' : user.role === 'teacher' ? 'Öğretmen' : 'Öğrenci'}</p>
                            </div>
                            
                            {/* ORTAK MENÜ */}
                            <div className="py-2">
                                {/* ADMIN PANELİ (Sadece Admin görsün) */}
                                {user.role === 'admin' && (
                                    <>
                                        <button 
                                            onClick={() => { navigate('/admin-dashboard'); setIsMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 font-bold flex items-center gap-2"
                                        >
                                            🛡️ Yönetici Paneli
                                        </button>
                                        <div className="border-b border-gray-100 dark:border-slate-700 my-1"></div>
                                    </>
                                )}

                                <button 
                                    onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2"
                                >
                                    👤 Profilim
                                </button>
                                <button 
                                    onClick={() => { navigate('/surveys'); setIsMenuOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2"
                                >
                                    📊 Anketler
                                </button>
                                
                                {/* XP MARKETİ (Sadece Öğrenciler görsün) */}
                                {user.role === 'student' && (
                                    <button 
                                        onClick={() => { navigate('/shop'); setIsMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-2 font-semibold"
                                    >
                                        🛒 XP Marketi
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => { navigate('/settings'); setIsMenuOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2"
                                >
                                    ⚙️ Ayarlar
                                </button>
                            </div>

                            {/* 4. Bölüm: Çıkış */}
                            <div className="border-t border-gray-100 dark:border-slate-700 mt-1 pt-1 bg-red-50/30 dark:bg-red-900/20">
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 font-bold flex items-center gap-2">
                                    🚪 Çıkış Yap
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                // --- GİRİŞ YAPMAMIŞSA (Login / Register Butonları) ---
                <div className="flex items-center gap-2 sm:gap-3">
                    <button 
                        onClick={() => navigate('/login')} 
                        className="px-3 sm:px-5 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 font-bold transition-colors flex items-center gap-1 sm:gap-2"
                    >
                        <span>🔑</span> <span className="hidden sm:inline">Giriş Yap</span>
                    </button>
                    
                    <button 
                        onClick={() => navigate('/register')} 
                        className="px-4 sm:px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-orange-200 transition-all transform hover:-translate-y-0.5 flex items-center gap-1 sm:gap-2"
                    >
                        <span>✨</span> <span className="hidden sm:inline">Kayıt Ol</span>
                    </button>
                </div>
            )}
            </div>
        </nav>
    );
};

export default Navbar;
