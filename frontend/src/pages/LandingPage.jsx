// src/pages/LandingPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Bileşenleri İçe Aktar
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LoginModal from '../components/modals/LoginModal';

// Bölümleri İçe Aktar
import Hero from '../sections/Hero';
import About from '../sections/About';
import Curriculum from '../sections/Curriculum';
import Courses from '../sections/Courses';
import Contact from '../sections/Contact';
import Chatbox from '../components/ui/Chatbox';
// Veriyi İçe Aktar
import { translations } from '../data/translations';

const LandingPage = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('tr');
  const [theme, setTheme] = useState('light');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const t = translations[lang] || translations['tr'];

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 🚨 DÜZELTME BURADA YAPILDI
  const handleLoginSuccess = (userRole) => {
    setIsLoginModalOpen(false); 

    if (userRole === 'teacher' || userRole === 'admin') {
      // App.jsx'te tanımladığımız doğru rota:
      navigate('/teacher/overview'); 
    } else if (userRole === 'student') {
      // App.jsx'te tanımladığımız doğru rota:
      navigate('/student/home');
    } else {
      navigate('/'); 
    }
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans flex flex-col transition-colors duration-300 relative">
        
        <Navbar 
          lang={lang} 
          setLang={setLang} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          t={t} 
          onLoginClick={() => setIsLoginModalOpen(true)} 
        />
        
        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
          t={t} // Çeviri prop'u
          onLoginSuccess={handleLoginSuccess} 
        />

        {/* Ana Bölümler */}
        <Hero t={t} />
        <About t={t} />
        <Curriculum lang={lang} t={t} />
        <Courses lang={lang} t={t} />
        <Contact t={t} />
        <div className="text-center py-6">
          <button onClick={() => navigate('/reset-password')} className="text-indigo-600 hover:underline font-medium">
            Şifre Sıfırlama
          </button>
        </div>
        
        <Footer t={t} />

        <Chatbox />

      </div>
    </div>
  );
};

export default LandingPage;