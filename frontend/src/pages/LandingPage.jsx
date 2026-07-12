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
import SkipLink from '../components/ui/SkipLink';
import { useTheme } from '../context/ThemeContext';
import { getHomePathForRole } from '../utils/roleRoutes';
import { absolutePublicUrl, getPublicSiteUrl } from '../utils/siteUrl';

// Veriyi İçe Aktar
import { translations } from '../data/translations';
import {
  appToLandingLocale,
  landingToAppLocale,
  readStoredLanguage,
  writeStoredLanguage,
} from '../i18n/locale';

const upsertJsonLd = (data) => {
  let script = document.head.querySelector('script[data-matova-jsonld="org"]');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-matova-jsonld', 'org');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
};
const LandingPage = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [lang, setLangState] = useState(() => appToLandingLocale(readStoredLanguage()));
  const setLang = (next) => {
    const normalized = next === 'en' ? 'en' : 'tr';
    setLangState(normalized);
    writeStoredLanguage(landingToAppLocale(normalized));
  };
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const theme = isDarkMode ? 'dark' : 'light';

  // Çeviri dosyanda 'patterns' anahtarı altında özelleştirilmiş metinler olduğunu varsayıyoruz
  const t = translations[lang] || translations['tr'];

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

  const openRoleEntry = (targetRole) => {
    if (targetRole === 'student') {
      navigate('/students');
      return;
    }

    if (targetRole === 'teacher') {
      navigate('/teachers');
      return;
    }

    navigate('/research');
  };

  useEffect(() => {
    const metadata = lang === 'tr'
      ? {
          title: 'Matova | Matematik Öğrenme ve Akademik Araştırma Platformu',
          description: 'Matova, okul matematiği programları ile yüksek lisans ve doktora düzeyi akademik araştırma modüllerini aynı platformda sunan yapay zeka destekli öğrenme ortamıdır.',
          ogTitle: 'Matova | Matematik Öğrenme ve Akademik Araştırma Platformu',
          ogDescription: 'Öğrenci, öğretmen ve akademik araştırma akışlarını ayrıştıran yapay zeka destekli matematik platformu.',
          locale: 'tr_TR',
          htmlLang: 'tr',
        }
      : {
          title: 'Matova | Math Learning and Academic Research Platform',
          description: 'Matova is an AI-supported environment that combines school mathematics programs with graduate and doctoral research modules.',
          ogTitle: 'Matova | Math Learning and Academic Research Platform',
          ogDescription: 'A mathematics platform with dedicated journeys for students, teachers, and academic researchers.',
          locale: 'en_US',
          htmlLang: 'en',
        };

    const baseUrl = getPublicSiteUrl();
    const ogImage = absolutePublicUrl('/og-image.png');

    document.title = metadata.title;
    document.documentElement.lang = metadata.htmlLang;

    upsertMeta('meta[name="description"]', 'content', metadata.description);
    upsertMeta('meta[property="og:title"]', 'content', metadata.ogTitle);
    upsertMeta('meta[property="og:description"]', 'content', metadata.ogDescription);
    upsertMeta('meta[property="og:url"]', 'content', `${baseUrl}/`);
    upsertMeta('meta[property="og:image"]', 'content', ogImage);
    upsertMeta('meta[property="og:locale"]', 'content', metadata.locale);
    upsertMeta('meta[name="twitter:title"]', 'content', metadata.ogTitle);
    upsertMeta('meta[name="twitter:description"]', 'content', metadata.ogDescription);
    upsertMeta('meta[name="twitter:image"]', 'content', ogImage);
    updateCanonical(`${baseUrl}/`);
    upsertJsonLd({
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Matova',
      url: `${baseUrl}/`,
      logo: absolutePublicUrl('/icon-512.png'),
      image: ogImage,
      description: metadata.description,
      sameAs: [],
    });
  }, [lang]);

  // Login Başarılı Olduğunda Yönlendirme
  const handleLoginSuccess = (userRole) => {
    setIsLoginModalOpen(false);
    navigate(getHomePathForRole(userRole));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-surface-950 text-surface-50' : 'bg-surface-50 text-surface-900'}`}>
      <SkipLink>{t.nav.skipToContent}</SkipLink>
      
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
        lang={lang}
        onLoginSuccess={handleLoginSuccess} 
      />

      {/* ANA İÇERİK ALANI */}
      <main id="main-content" tabIndex={-1} className="flex-grow">
        
        {/* Hero: "Örüntüleri Keşfet" temalı giriş alanı */}
        <Hero
          t={t}
          theme={theme}
          onPrimaryAction={() => setIsLoginModalOpen(true)}
          onSecondaryAction={() => scrollToSection('courses')}
          onStudentTrackClick={() => openRoleEntry('student')}
          onTeacherTrackClick={() => openRoleEntry('teacher')}
          onResearchTrackClick={() => openRoleEntry('research')}
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
      <Chatbox lang={lang} onLoginClick={() => setIsLoginModalOpen(true)} />

    </div>
  );
};

export default LandingPage;