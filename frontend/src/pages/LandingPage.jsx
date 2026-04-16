import React, { useState, useEffect, useContext } from 'react';
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
import { AuthContext } from '../context/AuthContext';

// Veriyi İçe Aktar
import { translations } from '../data/translations';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [lang, setLang] = useState('tr');
  const [theme, setTheme] = useState('light');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Çeviri dosyanda 'patterns' anahtarı altında özelleştirilmiş metinler olduğunu varsayıyoruz
  const t = translations[lang] || translations['tr'];

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const upsertMeta = (selector, attribute, value) => {
    let element = document.head.querySelector(selector);

    if (!element) {
      element = document.createElement('meta');
      const [attrName, attrValue] = selector
        .replace('meta[', '')
        .replace(']', '')
        .split('=');

      element.setAttribute(attrName, attrValue.replace(/"/g, ''));
      document.head.appendChild(element);
    }

    element.setAttribute(attribute, value);
  };

  const updateCanonical = (href) => {
    let link = document.head.querySelector('link[rel="canonical"]');

    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }

    link.setAttribute('href', href);
  };

  const routeByRole = (targetRole) => {
    if (targetRole === 'student') {
      navigate('/student/home');
      return;
    }

    if (targetRole === 'teacher') {
      navigate('/teacher/overview');
    }
  };

  const openRoleEntry = (targetRole) => {
    if (user?.role === targetRole || (targetRole === 'teacher' && user?.role === 'admin')) {
      routeByRole(targetRole);
      return;
    }

    if (targetRole === 'research') {
      scrollToSection('courses');
      return;
    }

    setIsLoginModalOpen(true);
  };

  // Tema değişikliğini body'ye uygula (Karanlık mod desteği için)
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const metadata = lang === 'tr'
      ? {
          title: 'Edumath | Matematik Öğrenme ve Akademik Araştırma Platformu',
          description: 'Edumath, okul matematiği programları ile yüksek lisans ve doktora düzeyi akademik araştırma modüllerini aynı platformda sunan yapay zeka destekli öğrenme ortamıdır.',
          ogTitle: 'Edumath | Matematik Öğrenme ve Akademik Araştırma Platformu',
          ogDescription: 'Öğrenci, öğretmen ve akademik araştırma akışlarını ayrıştıran yapay zeka destekli matematik platformu.',
          locale: 'tr_TR',
          htmlLang: 'tr',
        }
      : {
          title: 'Edumath | Math Learning and Academic Research Platform',
          description: 'Edumath is an AI-supported environment that combines school mathematics programs with graduate and doctoral research modules.',
          ogTitle: 'Edumath | Math Learning and Academic Research Platform',
          ogDescription: 'A mathematics platform with dedicated journeys for students, teachers, and academic researchers.',
          locale: 'en_US',
          htmlLang: 'en',
        };

    document.title = metadata.title;
    document.documentElement.lang = metadata.htmlLang;

    upsertMeta('meta[name="description"]', 'content', metadata.description);
    upsertMeta('meta[property="og:title"]', 'content', metadata.ogTitle);
    upsertMeta('meta[property="og:description"]', 'content', metadata.ogDescription);
    upsertMeta('meta[property="og:locale"]', 'content', metadata.locale);
    upsertMeta('meta[name="twitter:title"]', 'content', metadata.ogTitle);
    upsertMeta('meta[name="twitter:description"]', 'content', metadata.ogDescription);
    updateCanonical(window.location.origin + '/');
  }, [lang]);

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
        <Hero
          t={t}
          theme={theme}
          onPrimaryAction={() => setIsLoginModalOpen(true)}
          onSecondaryAction={() => scrollToSection('courses')}
          onStudentTrackClick={() => openRoleEntry('student')}
          onTeacherTrackClick={() => openRoleEntry('teacher')}
          onResearchTrackClick={() => scrollToSection('courses')}
        />

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