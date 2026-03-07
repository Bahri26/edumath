import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import api from '../../services/api';
import DailyDiscovery from '../../components/home/DailyDiscovery';
import { useTheme } from '../../hooks/useTheme';

// --- Veri Yapıları ---
const testimonials = [
    {
        name: 'Ayşe Y.',
        role: '8. Sınıf Öğrencisi',
        avatar: '👧',
        quote: 'EduMath sayesinde matematikte 40 puandan 85\'e çıktım! Artık soruları daha iyi anlıyorum ve kendime güveniyorum.'
    },
    {
        name: 'Mehmet Hoca',
        role: 'Matematik Öğretmeni',
        avatar: '👨‍🏫',
        quote: 'Öğrencilerimin gelişimini detaylı raporlarla takip edebiliyorum. Hangi konuyu anlamadıklarını hemen tespit edip müdahale ediyorum.'
    },
    {
        name: 'Can B.',
        role: '12. Sınıf Öğrencisi',
        avatar: '🧑‍🎓',
        quote: 'YKS\'ye hazırlanırken EduMath benim kişisel koçum oldu. Eksiklerimi hızlıca kapattım ve hedef üniversiteme girdim!'
    }
];

const faqs = [
    {
        question: 'EduMath ücretli mi?',
        answer: 'Şu anda EduMath tamamen ücretsiz! Yapay zeka destekli tüm özelliklere ve sınırsız sınav çözme hakkına sahipsiniz.'
    },
    {
        question: 'Hangi sınıf seviyelerine uygun?',
        answer: 'EduMath 5. sınıftan 12. sınıfa kadar tüm ortaokul ve lise öğrencilerine uygundur. MEB müfredatına uygun sorular içerir.'
    },
    {
        question: 'Mobil cihazlardan kullanılabilir mi?',
        answer: 'Evet! EduMath responsive tasarıma sahiptir ve telefon, tablet, bilgisayardan sorunsuz kullanılabilir.'
    }
];

const HomePage = () => {
    const navigate = useNavigate();

    // Local UI state
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [fact, setFact] = useState(null);
    const [stats, setStats] = useState({ totalUsers: 0, totalQuestions: 0, totalExams: 0 });

    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };
    const staggerContainer = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.12 } }
    };

    // Fetch minimal data for the homepage (best-effort; failures are non-fatal)
    useEffect(() => {
        let mounted = true;
        async function load() {
            try {
                const hasToken = (() => {
                    try {
                        const raw = localStorage.getItem('edumath_user');
                        if (!raw) return false;
                        const parsed = JSON.parse(raw);
                        return Boolean(parsed && parsed.token);
                    } catch (_) {
                        return false;
                    }
                })();

                const [statsRes, factRes, meRes] = await Promise.all([
                    api.get('/home/stats', { headers: { 'x-no-auth-redirect': '1' } }).then(r => r.data).catch(() => null),
                    api.get('/home/fact', { headers: { 'x-no-auth-redirect': '1' } }).then(r => r.data).catch(() => null),
                    hasToken
                        ? api.get('/auth/me', { headers: { 'x-no-auth-redirect': '1' } }).then(r => r.data).catch(() => null)
                        : Promise.resolve(null)
                ]);
                if (!mounted) return;
                                if (statsRes) setStats(prev => ({
                                    ...prev,
                                    totalUsers: statsRes.users,
                                    totalQuestions: statsRes.courses,
                                    totalExams: statsRes.announcements
                                }));
                if (factRes && factRes.fact) setFact(factRes.fact);
                if (meRes && meRes.user) setUser(meRes.user);
            } catch (err) {
                // ignore — homepage can render without these
                console.warn('Home page data load failed:', err.message);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        load();
        return () => { mounted = false; };
    }, []);

    // Scroll Fonksiyonu (Footer linkleri için)
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-center space-y-4 sm:space-y-6 px-4">
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }} 
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-5xl sm:text-6xl"
                >
                    🎓
                </motion.div>
                <p className="text-gray-600 dark:text-gray-300 font-semibold text-base sm:text-lg">EduMath Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="home-page bg-gray-50 dark:bg-gray-900 min-h-screen font-sans overflow-x-hidden flex flex-col w-full dark:text-gray-100">
            
            {/* --- HERO SECTION --- */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-800 text-white pb-16 sm:pb-20 md:pb-24 pt-16 sm:pt-24 md:pt-32 px-4 sm:px-6 md:px-8 rounded-b-[30px] sm:rounded-b-[40px] md:rounded-b-[50px] shadow-2xl overflow-hidden">
                {/* Arkaplan Animasyonları */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
                        transition={{ duration: 20, repeat: Infinity }}
                        className="absolute top-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full blur-3xl"
                    ></motion.div>
                    <motion.div 
                        animate={{ scale: [1, 1.3, 1], x: [0, -50, 0], y: [0, -30, 0] }}
                        transition={{ duration: 15, repeat: Infinity }}
                        className="absolute bottom-0 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full blur-3xl"
                    ></motion.div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-10 md:gap-12">
                    {/* Sol: Metin */}
                        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="w-full md:w-1/2 space-y-4 sm:space-y-5 md:space-y-6">
                        <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 text-orange-300 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase shadow-lg">
                            ✨ Yapay Zeka Destekli Öğrenme
                        </div>
                        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                            Matematiği <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
                                Ezberleme, Anla!
                            </span>
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-indigo-100 font-light leading-relaxed max-w-lg">
                            EduMath, senin öğrenme hızına adapte olur. Eksiklerini tespit eder ve seni hedefine en kısa yoldan ulaştırır.
                        </p>
                        
                        {/* Günün Bilgisi (Hero içinde küçük versiyon) */}
                        {fact && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                className="bg-white/10 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-white/20 text-xs sm:text-sm text-indigo-100 italic flex items-start gap-2"
                            >
                                <span className="flex-shrink-0">💡</span>
                                <div>
                                            <strong>Günün Bilgisi:</strong>{' '}
                                            <div
                                                className="inline-block"
                                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(
                                                    (typeof fact === 'string') ? fact : (fact?.content ?? fact?.title ?? '')
                                                ) }}
                                            />
                                        </div>
                            </motion.div>
                        )}

                        <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 pt-3 sm:pt-4 md:pt-6">
                            {user ? (
                                <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate(user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard')}
                                    className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl shadow-lg shadow-orange-500/40 transition-all min-w-0"
                                >
                                    Panele Git ⚡
                                </motion.button>
                            ) : (
                                <>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate('/login')}
                                        className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-white text-indigo-900 text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl transition-all min-w-0"
                                    >
                                        Giriş Yap
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate('/register')}
                                        className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-indigo-600/50 backdrop-blur-md border border-indigo-400 text-white text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl hover:bg-indigo-600 transition-all min-w-0"
                                    >
                                        Kayıt Ol
                                    </motion.button>
                                </>
                            )}
                        </div>
                    </motion.div>

                    {/* Sağ: İlüstrasyon (Mobile'da gizli) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
                        className="hidden md:flex w-full md:w-1/2 justify-center perspective-1000"
                    >
                        <div className="relative bg-white/10 backdrop-blur-xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/30 shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500">
                            <div className="text-center space-y-3 sm:space-y-4">
                                <div className="text-6xl sm:text-7xl md:text-8xl animate-pulse">🚀</div>
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Potansiyelini Keşfet</h3>
                                <div className="flex gap-2 sm:gap-3 md:gap-4">
                                    <div className="bg-white/10 p-2 sm:p-3 rounded-lg flex-1">
                                        <div className="text-xs text-indigo-200">Başarı</div>
                                        <div className="font-bold text-base sm:text-lg">%98</div>
                                    </div>
                                    <div className="bg-white/10 p-2 sm:p-3 rounded-lg flex-1">
                                        <div className="text-xs text-indigo-200">AI Analiz</div>
                                        <div className="font-bold text-base sm:text-lg">Aktif</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* --- GÜNÜN KEŞFİ BÖLÜMÜ --- */}
            <DailyDiscovery />

            {/* --- İSTATİSTİKLER --- */}
            <div className="relative -mt-12 sm:-mt-14 md:-mt-16 z-20 px-4 sm:px-6 mb-12 sm:mb-16">
                <motion.div 
                    variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
                >
                    <StatCard icon="👥" value={stats.totalUsers} label="Aktif Kullanıcı" color="text-blue-600" bgColor="bg-blue-50" />
                    <StatCard icon="📚" value={stats.totalQuestions} label="Soru Havuzu" color="text-orange-600" bgColor="bg-orange-50" />
                    <StatCard icon="✅" value={stats.totalExams} label="Tamamlanan Sınav" color="text-green-600" bgColor="bg-green-50" />
                </motion.div>
            </div>

            {/* --- ÖĞRENCİLER İÇİN BÖLÜMÜ (Yeni) --- */}
            <div id="for-students" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white overflow-hidden relative">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 sm:gap-12 md:gap-16">
                    <div className="w-full md:w-1/2">
                        <div className="w-full h-60 sm:h-72 md:h-96 bg-gradient-to-tr from-blue-400 to-indigo-500 rounded-2xl sm:rounded-3xl md:rounded-[3rem] shadow-2xl flex items-center justify-center relative">
                            <span className="text-6xl sm:text-7xl md:text-9xl relative z-10">🧑‍🎓</span>
                            <div className="absolute -top-10 -left-10 w-24 sm:w-28 md:w-32 h-24 sm:h-28 md:h-32 bg-yellow-300 rounded-full blur-2xl opacity-50"></div>
                            <div className="absolute bottom-10 right-10 w-28 sm:w-32 md:w-40 h-28 sm:h-32 md:h-40 bg-pink-400 rounded-full blur-2xl opacity-50"></div>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 space-y-4 sm:space-y-5 md:space-y-6">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-800">Öğrenciler İçin <span className="text-indigo-600">EduMath</span></h2>
                        <p className="text-base sm:text-lg md:text-lg text-gray-600 leading-relaxed">
                            Matematik artık korkulu rüyan değil! EduMath ile kendi hızında öğren, eksiklerini yapay zeka ile keşfet ve eğlenerek başarını arttır.
                        </p>
                        <ul className="space-y-3 sm:space-y-4">
                            <FeatureItem icon="🎮" title="Oyunlaştırılmış Öğrenme" desc="Puan topla, lig atla ve rozetler kazan." />
                            <FeatureItem icon="🤖" title="AI Destekli Analiz" desc="Sistem senin zayıf yönlerini bulur ve ona göre soru sorar." />
                            <FeatureItem icon="📱" title="Her Yerden Erişim" desc="Otobüste, evde, okulda... Telefonundan dilediğin zaman çöz." />
                        </ul>
                        <button onClick={() => navigate('/register')} className="mt-4 sm:mt-6 px-6 sm:px-8 py-2 sm:py-3 bg-indigo-600 text-white text-sm sm:text-base rounded-lg sm:rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all">
                            Hemen Öğrenci Ol
                        </button>
                    </div>
                </div>
            </div>

            {/* --- ÖĞRETMENLER İÇİN BÖLÜMÜ (Yeni) --- */}
            <div id="for-teachers" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-indigo-50 overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-8 sm:gap-12 md:gap-16">
                    <div className="w-full md:w-1/2">
                        <div className="w-full h-60 sm:h-72 md:h-96 bg-gradient-to-bl from-orange-400 to-red-500 rounded-2xl sm:rounded-3xl md:rounded-[3rem] shadow-2xl flex items-center justify-center relative">
                            <span className="text-6xl sm:text-7xl md:text-9xl relative z-10">👩‍🏫</span>
                            <div className="absolute top-10 left-10 w-24 sm:w-28 md:w-32 h-24 sm:h-28 md:h-32 bg-white rounded-full blur-2xl opacity-30"></div>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 space-y-4 sm:space-y-5 md:space-y-6">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-800">Öğretmenler İçin <span className="text-orange-500">EduMath</span></h2>
                        <p className="text-base sm:text-lg md:text-lg text-gray-600 leading-relaxed">
                            Sınıfınızı dijitalleştirin! Sınav kağıdı okuma derdine son verin ve öğrencilerinizin gelişimini anlık grafiklerle takip edin.
                        </p>
                        <ul className="space-y-3 sm:space-y-4">
                            <FeatureItem icon="📝" title="Hızlı Sınav Oluşturma" desc="Soru havuzundan seçerek veya otomatik sınavlar hazırlayın." />
                            <FeatureItem icon="📊" title="Detaylı Raporlama" desc="Hangi öğrenci hangi konuda zayıf? Tek tıkla görün." />
                            <FeatureItem icon="⏰" title="Zaman Tasarrufu" desc="Otomatik okuma sistemi ile kendinize daha çok vakit ayırın." />
                        </ul>
                        <button onClick={() => navigate('/register')} className="mt-4 sm:mt-6 px-6 sm:px-8 py-2 sm:py-3 bg-orange-500 text-white text-sm sm:text-base rounded-lg sm:rounded-xl font-bold shadow-lg hover:bg-orange-600 transition-all">
                            Öğretmen Hesabı Aç
                        </button>
                    </div>
                </div>
            </div>

            {/* --- KULLANICI YORUMLARI --- */}
            <Section title="Başarı Hikayeleri" subtitle="EduMath ile hedeflerine ulaşanlar anlatıyor.">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    {testimonials.map((t, i) => (
                        <motion.div 
                            key={i} whileHover={{ y: -5 }} 
                            className="bg-white p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 flex flex-col"
                        >
                            <div className="flex items-center gap-3 sm:gap-4 mb-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">{t.avatar}</div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-gray-800 text-sm sm:text-base truncate">{t.name}</h4>
                                    <p className="text-xs text-gray-500 truncate">{t.role}</p>
                                </div>
                            </div>
                            <p className="text-gray-600 italic text-xs sm:text-sm flex-1">"{t.quote}"</p>
                            <div className="mt-4 flex text-yellow-400 text-xs">⭐⭐⭐⭐⭐</div>
                        </motion.div>
                    ))}
                </div>
            </Section>

            {/* --- SIKÇA SORULAN SORULAR --- */}
            <Section bg="bg-gray-100" title="Merak Edilenler">
                <div className="max-w-3xl mx-auto space-y-2 sm:space-y-3 md:space-y-4 px-4">
                    {faqs.map((faq, i) => (
                        <details key={i} className="bg-white p-4 sm:p-5 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 group cursor-pointer">
                            <summary className="font-bold text-sm sm:text-base text-gray-800 flex justify-between items-center list-none">
                                {faq.question}
                                <span className="text-indigo-500 transform group-open:rotate-180 transition-transform flex-shrink-0 ml-2">▼</span>
                            </summary>
                            <p className="mt-2 sm:mt-3 text-gray-600 text-xs sm:text-sm leading-relaxed">{faq.answer}</p>
                        </details>
                    ))}
                </div>
            </Section>

            {/* Footer is provided globally by MainLayout; removed local duplicate */}
        </div>
    );
};

// --- YARDIMCI BİLEŞENLER ---

const Section = ({ title, subtitle, children, bg = "bg-white" }) => (
    <div className={`py-12 sm:py-16 md:py-20 px-4 sm:px-6 ${bg}`}>
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-800">{title}</h2>
                {subtitle && <p className="text-sm sm:text-base text-gray-500 mt-3 sm:mt-4 max-w-2xl mx-auto">{subtitle}</p>}
                <div className="h-1 w-16 sm:w-20 bg-orange-500 mx-auto mt-3 sm:mt-4 rounded-full"></div>
            </div>
            {children}
        </div>
    </div>
);

const FeatureItem = ({ icon, title, desc }) => (
    <div className="flex items-start gap-3 sm:gap-4">
        <div className="bg-white p-1.5 sm:p-2 rounded-lg shadow-sm border border-gray-100 text-xl sm:text-2xl flex-shrink-0">{icon}</div>
        <div className="min-w-0">
            <h4 className="font-bold text-gray-800 text-sm sm:text-base">{title}</h4>
            <p className="text-xs sm:text-sm text-gray-600">{desc}</p>
        </div>
    </div>
);

const StatCard = ({ icon, value, label, color, bgColor }) => (
    <motion.div 
        whileHover={{ y: -10 }}
        className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 flex items-center gap-4 sm:gap-6"
    >
        <div className={`w-16 sm:w-20 h-16 sm:h-20 ${bgColor} ${color} rounded-lg sm:rounded-2xl flex items-center justify-center text-2xl sm:text-4xl shadow-inner flex-shrink-0`}>
            {icon}
        </div>
        <div className="min-w-0">
            <h3 className="text-2xl sm:text-4xl font-black text-gray-800">{value}</h3>
            <p className="text-gray-500 font-medium mt-1 text-xs sm:text-base">{label}</p>
        </div>
    </motion.div>
);

const SocialIcon = ({ icon }) => (
    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-800 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-500 hover:text-white transition-all text-base sm:text-lg">
        {icon}
    </div>
);

export default HomePage;