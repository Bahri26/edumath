import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Bileşenleri İçe Aktar
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import LoginModal from '../components/modals/LoginModal';

// Bölümleri İçe Aktar (Örüntü Temalı İçerikler)
import Hero from '../sections/Hero'; 
import About from '../sections/About';
import Curriculum from '../sections/Curriculum'; // Kademeli Örüntü Müfredatı
import Courses from '../sections/Courses';       // İnteraktif Örüntü Modülleri
import Contact from '../sections/Contact';
import Chatbox from '../components/ui/Chatbox';

// Veriyi İçe Aktar
import { translations } from '../data/translations';

const LandingPage = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('tr');
  const [theme, setTheme] = useState('light');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Çeviri dosyanda 'patterns' anahtarı altında özelleştirilmiş metinler olduğunu varsayıyoruz
  const t = translations[lang] || translations['tr'];

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Tema değişikliğini body'ye uygula (Karanlık mod desteği için)
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Login Başarılı Olduğunda Yönlendirme
  const handleLoginSuccess = (userRole) => {
    setIsLoginModalOpen(false); 

    // Örüntü projesine özel dashboard yönlendirmeleri
    if (userRole === 'teacher' || userRole === 'admin') {
      navigate('/teacher/overview'); 
    } else if (userRole === 'student') {
      navigate('/student/home'); // Öğrenci burada kendi seviyesindeki örüntüleri görür
    } else {
      navigate('/'); 
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Gezinme Çubuğu */}
      <Navbar 
        lang={lang} 
        setLang={setLang} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        t={t} 
        onLoginClick={() => setIsLoginModalOpen(true)} 
      />
      
      {/* Giriş ve Kayıt Modalı */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        t={t} 
        onLoginSuccess={handleLoginSuccess} 
      />

      {/* ANA İÇERİK ALANI */}
      <main className="flex-grow">
        
        {/* Hero: "Örüntüleri Keşfet" temalı giriş alanı */}
        <Hero t={t} theme={theme} />

        {/* About: Matematiksel düşünme ve örüntülerin önemi */}
        <About t={t} />

        {/* Curriculum: İlkokul (Şekil), Ortaokul (Sayı), Lise (Diziler) ayrımı */}
        <Curriculum lang={lang} t={t} focus="patterns" />

        {/* Courses: İnteraktif örüntü çözme modülleri */}
        <Courses lang={lang} t={t} />

        {/* Contact: Geri bildirim ve destek */}
        <Contact t={t} />
        
      </main>

      {/* Alt Bilgi */}
      <Footer t={t} />

      {/* Yapay Zeka Destekli Örüntü Asistanı */}
      <Chatbox assistantType="math_expert" />

    </div>
  );
};

export default LandingPage;