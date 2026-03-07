import React from 'react';
import { useNavigate } from 'react-router-dom';

const SocialIcon = ({ icon }) => (
  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-500 hover:text-white transition-all text-base sm:text-lg">
      {icon}
  </div>
);

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="w-full bg-slate-900 text-slate-300 py-12 sm:py-14 md:py-16 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-10 mb-8 sm:mb-10 w-full">
          <div className="col-span-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-orange-500">Edu</span>Math
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-4 sm:mb-6">
              Matematiği sevdiren, yapay zeka destekli yeni nesil eğitim platformu.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <SocialIcon icon="🐦" />
              <SocialIcon icon="📸" />
              <SocialIcon icon="💼" />
            </div>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-bold mb-3 sm:mb-4 text-sm sm:text-base">Hızlı Erişim</h4>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li><button onClick={() => navigate('/')} className="hover:text-orange-400 transition">Ana Sayfa</button></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-orange-400 transition">Giriş Yap</button></li>
              <li><button onClick={() => navigate('/register')} className="hover:text-orange-400 transition">Kayıt Ol</button></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-bold mb-3 sm:mb-4 text-sm sm:text-base">Platform</h4>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li><button onClick={() => navigate('/students')} className="hover:text-orange-400 transition">Öğrenciler İçin</button></li>
              <li><button onClick={() => navigate('/teachers')} className="hover:text-orange-400 transition">Öğretmenler İçin</button></li>
              <li><button onClick={() => navigate('/curriculum')} className="hover:text-orange-400 transition">Müfredat</button></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="text-white font-bold mb-3 sm:mb-4 text-sm sm:text-base">İletişim</h4>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-slate-400">
              <li>📧 destek@edumath.com</li>
              <li>📍 Teknopark, İstanbul</li>
              <li>📞 0850 123 45 67</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4 sm:gap-6 w-full">
          <p>&copy; 2026 EduMath. Tüm hakları saklıdır.</p>
          <div className="flex gap-4 sm:gap-6">
            <a href="#" className="hover:text-white">Gizlilik Politikası</a>
            <a href="#" className="hover:text-white">Kullanım Şartları</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

