// frontend-react/src/pages/HomePage.jsx (YAZMA ANİMASYONU KALDIRILDI - SON HALİ)

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/HomePage.css';
import assessmentImage from '../assets/images/abakus.jpg';
import gamificationService from '../services/gamificationService';
import dailyChallengeService from '../services/dailyChallengeService';
import learningPathService from '../services/learningPathService';

// Havai Fişek Bileşeni
const Fireworks = () => {
    const numParticles = 50;
    const particles = [];
    for (let i = 0; i < numParticles; i++) {
        const top = Math.random() * 30 + '%';
        const left = Math.random() * 100 + '%';
        const colorClass = `color${Math.floor(Math.random() * 4) + 1}`;
        const delayClass = `delay${Math.floor(Math.random() * 4) + 1}`;
        const tx = (Math.random() - 0.5) * 300;
        const ty = (Math.random() - 0.5) * 300;
        particles.push(
            <div key={i} className={`firework ${colorClass} ${delayClass}`}
                style={{ top: top, left: left, '--tx': `${tx}px`, '--ty': `${ty}px` }}>
            </div>
        );
    }
    return <div className="fireworks-container">{particles}</div>;
};


const HomePage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ questions: 0, students: 0, xp: 0 });
    const [displayStats, setDisplayStats] = useState({ questions: 0, students: 0, xp: 0 });
    const [dashboardData, setDashboardData] = useState(null);
    const [dailyChallenges, setDailyChallenges] = useState([]);
    const [pathPreview, setPathPreview] = useState(null);
    const [loadingChallenges, setLoadingChallenges] = useState(false);
    const [loadingPath, setLoadingPath] = useState(false);
    const [ctaHover, setCtaHover] = useState(false);

    // Fake baseline stats (later can be replaced with real analytics endpoint)
    useEffect(() => {
        // Rough placeholders scaled per time; could be replaced by API
        const base = {
            questions: 1240,
            students: 312,
            xp: 48210
        };
        setStats(base);
    }, []);

    // Animated counter
    useEffect(() => {
        let frame = 0;
        const duration = 900; // ms
        const start = performance.now();
        const animate = (ts) => {
            const progress = Math.min((ts - start) / duration, 1);
            setDisplayStats({
                questions: Math.floor(progress * stats.questions),
                students: Math.floor(progress * stats.students),
                xp: Math.floor(progress * stats.xp)
            });
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [stats]);

    // Load gamification & challenges if logged in
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const dash = await gamificationService.getDashboard();
                setDashboardData(dash);
                setLoadingChallenges(true);
                const ch = await dailyChallengeService.getMyChallenges();
                setDailyChallenges(ch.slice(0, 3));
            } catch (e) {
                console.warn('Gamification data unavailable:', e.message);
            } finally {
                setLoadingChallenges(false);
            }
        };
        fetchData();
    }, [user]);

    // Learning path preview for grade (1 or user.gradeLevel)
    useEffect(() => {
        const loadPath = async () => {
            const grade = user?.gradeLevel || 1;
            setLoadingPath(true);
            try {
                const path = await learningPathService.getByGrade(grade);
                setPathPreview(path);
            } catch (e) {
                console.warn('Path preview yok:', e.message);
            } finally {
                setLoadingPath(false);
            }
        };
        loadPath();
    }, [user]);

    // --- Animasyon Ref'leri ---
    const whyUsRef = useRef(null);
    const assessmentRef = useRef(null);
    const coursesRef = useRef(null);
    const examsRef = useRef(null);
    const subtitleRef = useRef(null); // Alt başlık/buton animasyonu için kaldı
    const buttonsRef = useRef(null);  // Alt başlık/buton animasyonu için kaldı

    // --- Genel Section Animasyonları (Intersection Observer) ---
    useEffect(() => {
        const sections = [whyUsRef, assessmentRef, coursesRef, examsRef, subtitleRef, buttonsRef]; // subtitle ve buttons eklendi
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    // Hero elementleri hariç diğerleri için normal animasyon
                    if (entry.isIntersecting && !entry.target.classList.contains('heroSubtitle') && !entry.target.classList.contains('heroButtons')) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                    // Hero elementleri için gecikmeli animasyon (opsiyonel)
                    // Veya direkt 'is-visible' sınıfını JSX'e ekleyebiliriz (aşağıda yapıldığı gibi)
                });
            },
            { threshold: 0.1 }
        );
        sections.forEach((sectionRef) => {
            if (sectionRef.current) observer.observe(sectionRef.current);
        });
        return () => {
            sections.forEach((sectionRef) => {
                if (sectionRef.current) observer.unobserve(sectionRef.current);
            });
        };
    }, []);


    const getDashboardPath = () => {
        if (user?.roles?.isTeacher) return '/teacher/dashboard';
        if (user?.roles?.isStudent) return '/student/dashboard';
        return '/';
    };

    const gradeTaglineMap = {
        1: '1. Sınıf temel örüntüler ile başlayın',
        4: '4. Sınıf sayı & şekil örüntülerinde ustalaşın',
        8: '8. Sınıf cebirsel örüntü dönüşümleri sizi bekliyor',
        9: 'Lise başlangıcı: sistematik düşünme ve pattern analizi'
    };
    const dynamicTagline = gradeTaglineMap[user?.gradeLevel] || 'Örüntüler öğrenme yolunu açın';

    return (
        <div className="homePage">
            <Fireworks />
            {/* ========= Hero Section (Sola Yaslı Metin, STATİK BAŞLIK) ========= */}
            <section className="heroSection text-white">
                <div className="container heroGrid">
                    {/* LEFT SIDE CONTENT */}
                    <div className="heroLeft">
                        <h1 className="display-3 fw-bold mb-4 heroTitle">
                            Geleceğin Eğitim Platformuna<br />Hoş Geldiniz
                        </h1>
                        <p ref={subtitleRef} className="lead mb-4 heroSubtitle is-visible">
                            <span className="taglineAccent">{dynamicTagline.split(':')[0]}</span>{dynamicTagline.includes(':') && (<><br /><span className="taglineSub">{dynamicTagline.split(':').slice(1).join(':').trim()}</span></>)}
                        </p>
                        <div className="glassRow">
                            <div className="gCard">
                                <div className="gIcon"><i className="fas fa-database"></i></div>
                                <div className="gContent">
                                    <div className="gTitle">Soru Havuzu</div>
                                    <div className="gValue">{displayStats.questions.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="gCard">
                                <div className="gIcon"><i className="fas fa-user-graduate"></i></div>
                                <div className="gContent">
                                    <div className="gTitle">Aktif Öğrenci</div>
                                    <div className="gValue">{displayStats.students.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="gCard">
                                <div className="gIcon"><i className="fas fa-bolt"></i></div>
                                <div className="gContent">
                                    <div className="gTitle">Toplam XP</div>
                                    <div className="gValue">{displayStats.xp.toLocaleString()} XP</div>
                                </div>
                            </div>
                        </div>
                        <div ref={buttonsRef} className="heroButtons mt-4 is-visible">
                            <div className="ctaDeck">
                                {user ? (
                                    <Link to={getDashboardPath()} className="ctaPrimary">
                                        <i className="fas fa-rocket me-2"></i> Macerana Devam Et
                                    </Link>
                                ) : (
                                    <Link to="/register" className="ctaPrimary">
                                        <i className="fas fa-rocket me-2"></i> Macerana Başla
                                    </Link>
                                )}
                                <Link to="/teacher/classes" className="ctaSecondary">
                                    <i className="fas fa-compass me-2"></i> Sınıfları Keşfet
                                </Link>
                                {!user && (
                                    <Link to="/login" className="ctaGhost">
                                        <i className="fas fa-bolt me-2"></i> Hemen Katıl
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* RIGHT SIDE DECORATIVE PANEL */}
                    <div className="heroRight">
                        <div className="gradientOrb"></div>
                        <div className="meshLines"></div>
                        <div className={`floatingGroup ${!dashboardData ? 'loading' : ''}`}> 
                            {dashboardData ? (
                                <>
                                    <div className="glassCard cardA fadeInCard">
                                        <div className="miniLabel"><i className="fas fa-heart"></i> Kalpler</div>
                                        <div className="miniValue">{`${dashboardData.gamification.hearts.current}/5`}</div>
                                    </div>
                                    <div className="glassCard cardB fadeInCard">
                                        <div className="miniLabel"><i className="fas fa-fire"></i> Streak</div>
                                        <div className="miniValue">{`${dashboardData.gamification.streak.current} gün`}</div>
                                        <div className="miniBar"><div style={{width: `${Math.min(dashboardData.gamification.streak.current, 30)/30*100}%`}}></div></div>
                                    </div>
                                    <div className="glassCard cardC fadeInCard">
                                        <div className="miniLabel"><i className="fas fa-trophy"></i> Rozetler</div>
                                        <div className="miniValue">{dashboardData.achievements?.completedCount || 0} / {dashboardData.achievements?.totalCount || 0}</div>
                                    </div>
                                    <div className="glassCard cardD fadeInCard">
                                        <div className="miniLabel"><i className="fas fa-star"></i> Seviye</div>
                                        <div className="miniValue">{dashboardData.gamification.level}</div>
                                        <div className="miniBar level"><div style={{width: `${(dashboardData.gamification.xp % 100)}%`}}></div></div>
                                    </div>
                                </>
                            ) : (
                                // Skeleton shimmer placeholders
                                <>
                                    <div className="glassCard cardA skeleton">
                                        <div className="shimmerBar short"></div>
                                        <div className="shimmerText w40"></div>
                                    </div>
                                    <div className="glassCard cardB skeleton">
                                        <div className="shimmerBar medium"></div>
                                        <div className="shimmerText w60"></div>
                                        <div className="miniBar"><div className="shimmerFill"></div></div>
                                    </div>
                                    <div className="glassCard cardC skeleton">
                                        <div className="shimmerBar long"></div>
                                        <div className="shimmerText w50"></div>
                                    </div>
                                    <div className="glassCard cardD skeleton">
                                        <div className="shimmerBar short"></div>
                                        <div className="shimmerText w30"></div>
                                        <div className="miniBar level"><div className="shimmerFill"></div></div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Öğrenme Deneyimi (Adaptif, İpucu, Görev Zinciri, Hızlı Mod) */}
            <section className="pillarsSection contentSection">
                <div className="container">
                    <h2 className="sectionTitle text-center">Öğrenme Deneyimi</h2>
                    <div className="pillGrid">
                        {[
                            { icon:'🎯', title:'Adaptif Zorluk', desc:'Performansına göre soru seviyesi otomatik ayarlanır.', chips:['Kolay','Orta','Zor'], demo:'difficulty' },
                            { icon:'💡', title:'Anında İpucu', desc:'Yanlışta neden yanlışı ve ipuçları görürsün.', chips:['Neden?','İpucu'] },
                            { icon:'⛓️', title:'Görev Zinciri', desc:'Ardışık görevlerde ekstra bonus ve çarpan.', chips:['+XP','Bonus'] },
                            { icon:'⚡', title:'Hızlı Mod', desc:'60 sn seri çözüm, combo ile XP yağmuru.', chips:['x2 combo','60s'], demo:'combo' },
                        ].map((p,idx)=> (
                            <div key={idx} className="pillCard">
                                <div className="pillIcon">{p.icon}</div>
                                <div className="pillBody">
                                    <h5>{p.title}</h5>
                                    <p>{p.desc}</p>
                                    <div className="pillChips">
                                        {p.chips.map((c,i)=> <span key={i} className="chip">{c}</span>)}
                                    </div>
                                    {p.demo === 'difficulty' && (
                                        <div className="miniDemo difficultyBar" aria-label="Zorluk seviyesi">
                                            <div className="segment easy"></div>
                                            <div className="segment mid"></div>
                                            <div className="segment hard"></div>
                                            <div className="indicator" style={{left:'58%'}}></div>
                                        </div>
                                    )}
                                    {p.demo === 'combo' && (
                                        <div className="miniDemo comboRow" aria-label="Combo göstergesi">
                                            <span className="dot active"></span>
                                            <span className="dot active"></span>
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                            <span className="comboBadge">x2</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Öğretmen Mini-Panel Şeridi (statik demo) */}
            <section className="teacherRibbon contentSectionAlternate">
                <div className="container">
                    <div className="ribbon">
                        <div className="rItem"><i className="fas fa-users"></i> Sınıf canlı: <strong>23</strong></div>
                        <div className="rItem"><i className="fas fa-clock"></i> Ortalama süre: <strong>18 dk</strong></div>
                        <div className="rItem"><i className="fas fa-calendar-day"></i> Bugün aktif: <strong>57 öğrenci</strong></div>
                        <Link to="/teacher/dashboard" className="rCta">Öğretmen Paneline Git</Link>
                    </div>
                </div>
            </section>

            {/* Seasonal Banner */}
            <section className="seasonBanner">
                <div className="container seasonInner">
                    <div className="sLeft">
                        <div className="sKicker">Duyuru</div>
                        <h3>Pattern Sprint Week</h3>
                        <p>Bu hafta örüntü sprintine katıl, ekstra görevlerle %20 bonus XP kazan!</p>
                    </div>
                    <div className="sRight">
                        <Link to={user ? '/student/dashboard' : '/register'} className="sCta">Katıl</Link>
                    </div>
                </div>
            </section>

            

            {/* Gamification Teaser */}
            <section className="gamificationTeaser contentSectionAlternate">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-6 mb-4 mb-lg-0">
                            <h2 className="sectionSubtitle">Oyunlaştırılmış Öğrenme</h2>
                            <p className="text-muted mb-3">Kalpler, XP, seviye atlama, günlük görevler ve rozetlerle sürekli motive olun.</p>
                            {dashboardData ? (
                                <div className="gamificationMetrics">
                                    <div className="metric"><i className="fas fa-heart"></i><span>{dashboardData.gamification.hearts.current} / 5 Kalp</span></div>
                                    <div className="metric"><i className="fas fa-fire"></i><span>{dashboardData.gamification.streak.current} Gün Streak</span></div>
                                    <div className="metric xpBar">
                                        <span>Seviye {dashboardData.gamification.level}</span>
                                        <div className="bar"><div style={{width: `${(dashboardData.gamification.xp % 100)}%`}}></div></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="blurredPreview">
                                    <div className="metric"><i className="fas fa-heart"></i><span>•• / 5 Kalp</span></div>
                                    <div className="metric"><i className="fas fa-fire"></i><span>•• Gün Streak</span></div>
                                    <div className="metric xpBar">
                                        <span>Seviye ••</span>
                                        <div className="bar"><div style={{width: '35%'}}></div></div>
                                    </div>
                                    <div className="overlayText">Giriş yapınca açılır</div>
                                </div>
                            )}
                        </div>
                        <div className="col-lg-6 dailyChallengesPreview">
                            <h3 className="mb-3">Bugünün Görevleri</h3>
                            {user ? (
                                loadingChallenges ? <p>Yükleniyor...</p> : (
                                    <div className="challengeGrid">
                                        {dailyChallenges.map(ch => (
                                            <div key={ch._id} className={`challengeCard ${ch.isCompleted ? 'completed' : ''}`}>
                                                <div className="challengeIcon">{ch.icon || '🎯'}</div>
                                                <div className="challengeBody">
                                                    <h6>{ch.title}</h6>
                                                    <p>{ch.description}</p>
                                                    <div className="progressLine">
                                                        <div style={{width: `${ch.progress?.percentage || 0}%`}}></div>
                                                    </div>
                                                </div>
                                                {ch.isCompleted && <span className="badgeComplete">Tamamlandı</span>}
                                            </div>
                                        ))}
                                        {dailyChallenges.length === 0 && <p>Bugün görev bulunamadı.</p>}
                                    </div>
                                )
                            ) : (
                                <p className="text-muted">Görevleri görmek için giriş yapın.</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ========= Neden Biz? Section ========= */}
            <section ref={whyUsRef} className="whyUsSection contentSection">
                <div className="container text-center">
                    <h2 className="sectionTitle">Neden Biz?</h2>
                    <div className="row g-4 justify-content-center">
                        {/* Kart 1 */}
                        <div className="col-md-6 col-lg-4 d-flex">
                            <div className="featureCard card h-100 shadow-sm p-3 w-100">
                                <div className="cardBody">
                                    <i className="fas fa-book-open text-primary fa-2x mb-3"></i>
                                    <h5 className="cardTitle">Kapsamlı İçerik</h5>
                                    <p className="cardText">Geniş ders ve konu yelpazesi ile öğrenme ihtiyaçlarınıza uygun kaynaklar.</p>
                                </div>
                            </div>
                        </div>
                        {/* Kart 2 */}
                        <div className="col-md-6 col-lg-4 d-flex">
                             <div className="featureCard card h-100 shadow-sm p-3 w-100">
                                <div className="cardBody">
                                    <i className="fas fa-users text-success fa-2x mb-3"></i>
                                    <h5 className="cardTitle">Etkileşimli Deneyim</h5>
                                    <p className="cardText">Sınavlar, ödevler ve tartışmalarla aktif öğrenme ortamı.</p>
                                </div>
                            </div>
                        </div>
                        {/* Kart 3 */}
                        <div className="col-md-6 col-lg-4 d-flex">
                             <div className="featureCard card h-100 shadow-sm p-3 w-100">
                                <div className="cardBody">
                                     <i className="fas fa-chart-bar text-info fa-2x mb-3"></i>
                                    <h5 className="cardTitle">İlerleme Takibi</h5>
                                    <p className="cardText">Performansınızı takip edin ve gelişim alanlarınızı belirleyin.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

             {/* ========= Ölçme ve Değerlendirme Section ========= */}
             <section ref={assessmentRef} className="assessmentSection contentSectionAlternate">
                 <div className="container">
                     <h2 className="sectionTitle text-center">Ölçme ve Değerlendirme</h2>
                     <div className="row align-items-center gy-4">
                         <div className="col-lg-6 assessmentText order-lg-2 text-center text-lg-start">
                             <h3 className="mb-3 fw-semibold">Bilginizi Test Edin, Gelişiminizi Görün</h3>
                             <p className="lead mb-4">Platformumuz, öğrenme sürecinizi desteklemek için çeşitli ölçme ve değerlendirme araçları sunar:</p>
                             <ul className="text-start list-unstyled assessmentFeatures">
                                  <li><i className="fas fa-check-circle text-primary me-2"></i>Farklı soru tiplerini destekleyen esnek sınavlar.</li>
                                  <li><i className="fas fa-check-circle text-primary me-2"></i>Anında geri bildirim ve detaylı sonuç analizi.</li>
                                  <li><i className="fas fa-check-circle text-primary me-2"></i>Kazanım bazlı performans takibi.</li>
                                  <li><i className="fas fa-check-circle text-primary me-2"></i>Öğretmenler için kolay notlandırma ve raporlama.</li>
                             </ul>
                             <Link to="/teacher/exams" className="btn btn-primary mt-3 shadow">
                                 Daha Fazla Bilgi <i className="fas fa-arrow-right ms-2"></i>
                             </Link>
                         </div>
                         <div className="col-lg-6 text-center order-lg-1">
                             <img src={assessmentImage} alt="Ölçme Değerlendirme" className="img-fluid assessmentImage shadow rounded" />
                         </div>
                     </div>
                 </div>
             </section>

            {/* ========= Learning Path Preview ========= */}
            <section className="learningPathPreview contentSectionAlternate">
                <div className="container">
                    <h2 className="sectionTitle text-center">Öğrenme Yolu Önizleme</h2>
                    {loadingPath && <p>Yükleniyor...</p>}
                    {!loadingPath && pathPreview ? (
                        <div className="unitsRail">
                            {pathPreview.units.slice(0,5).map(unit => (
                                <div key={unit.unitNumber} className={`unitBox ${unit.isUnlocked ? 'unlocked' : 'locked'}`}> 
                                    <div className="unitHeader">
                                        <span className="unitEmoji">{unit.icon || '📐'}</span>
                                        <span className="unitTitle">{unit.title}</span>
                                    </div>
                                    <div className="lessonsRow">
                                        {unit.lessons.slice(0,4).map(lesson => (
                                            <div key={lesson.lessonNumber} className={`lessonDot ${lesson.isLocked ? 'locked' : lesson.isCompleted ? 'completed' : 'open'}`}></div>
                                        ))}
                                        {unit.lessons.length > 4 && <span className="moreDots">+{unit.lessons.length - 4}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (!loadingPath && <p className="text-muted">Henüz öğrenme yolu oluşturulmamış.</p>)}
                    <div className="text-center mt-4">
                        <Link to={user ? getDashboardPath() : '/register'} className="btn btn-primary btn-lg shadow">
                            {user ? 'Yoluma Devam Et' : 'Öğrenme Yolunu Başlat'}
                        </Link>
                    </div>
                </div>
            </section>

            {/* ========= Dersler Section ========= */}
            <section ref={coursesRef} className="coursesSection contentSection">
                <div className="container">
                    <h2 className="sectionTitle text-center">Popüler Dersler</h2>
                    <div className="row g-4 justify-content-center">
                        {/* Ders Kartı 1 */}
                        <div className="col-md-6 col-lg-4 d-flex">
                             <div className="courseCard card shadow-sm w-100">
                                 <div className="courseCardImageContainer text-primary">
                                     <i className="fas fa-calculator fa-4x"></i>
                                 </div>
                                  <div className="courseCardBody">
                                     <h5>Matematik</h5>
                                     <p>Temel işlemlerden ileri konulara kadar matematiğin eğlenceli dünyasını keşfedin.</p>
                                      <div className="courseCardFooter text-end">
                                          <Link to="/teacher/classes" className="btn btn-sm btn-outline-primary">İncele</Link>
                                     </div>
                                 </div>
                             </div>
                        </div>
                         {/* Ders Kartı 2 */}
                        <div className="col-md-6 col-lg-4 d-flex">
                             <div className="courseCard card shadow-sm w-100">
                                 <div className="courseCardImageContainer text-success">
                                     <i className="fas fa-flask fa-4x"></i>
                                 </div>
                                  <div className="courseCardBody">
                                     <h5>Fen Bilimleri</h5>
                                     <p>Canlıların yapısından evrenin sırlarına uzanan bilimsel bir yolculuğa çıkın.</p>
                                      <div className="courseCardFooter text-end">
                                          <Link to="#" className="btn btn-sm btn-outline-primary">İncele</Link>
                                     </div>
                                 </div>
                             </div>
                        </div>
                         {/* Ders Kartı 3 */}
                        <div className="col-md-6 col-lg-4 d-flex">
                            <div className="courseCard card shadow-sm w-100">
                                 <div className="courseCardImageContainer text-info">
                                     <i className="fas fa-landmark fa-4x"></i>
                                 </div>
                                  <div className="courseCardBody">
                                     <h5>Sosyal Bilgiler</h5>
                                     <p>Tarihten coğrafyaya, toplumları ve kültürleri anlamanın anahtarı.</p>
                                     <div className="courseCardFooter text-end">
                                          <Link to="#" className="btn btn-sm btn-outline-primary">İncele</Link>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                    <div className="text-center mt-5">
                         <Link to="/teacher/classes" className="btn btn-primary btn-lg shadow">Tüm Dersleri Gör</Link>
                    </div>
                </div>
            </section>

            {/* ========= Sınavlar Section ========= */}
             <section ref={examsRef} className="examsSection contentSectionAlternate">
                 <div className="container">
                     <h2 className="sectionTitle text-center">Esnek Sınav Sistemi</h2>
                     <div className="row align-items-center gy-4">
                         {/* Metin İçeriği */}
                         <div className="col-lg-6 examsText text-center text-lg-start">
                             <h3 className="mb-3 fw-semibold">Öğrenmeyi Değerlendirin, Başarıyı Ölçün</h3>
                             <p className="lead mb-4">Gelişmiş sınav modülümüz ile öğrencilerinizi etkili bir şekilde değerlendirin:</p>
                             <ul className="text-start list-unstyled examsFeatures">
                                  <li><i className="fas fa-check-circle text-warning me-2"></i>Çoktan seçmeli, doğru/yanlış, boşluk doldurma gibi farklı soru tipleri.</li>
                                  <li><i className="fas fa-check-circle text-warning me-2"></i>Soruları kolayca havuzdan seçme veya yeni soru oluşturma.</li>
                                  <li><i className="fas fa-check-circle text-warning me-2"></i>Zaman sınırlaması ve otomatik puanlama seçenekleri.</li>
                                  <li><i className="fas fa-check-circle text-warning me-2"></i>Detaylı analiz ve raporlarla öğrenci performansını izleme.</li>
                             </ul>
                             <Link to="/teacher/exams" className="btn btn-warning mt-3 shadow">
                                 Sınav Özelliklerini Keşfet <i className="fas fa-arrow-right ms-2"></i>
                             </Link>
                         </div>
                         {/* İkon */}
                         <div className="col-lg-6 text-center order-lg-first">
                             <div className="examIconContainer">
                                 <i className="fas fa-file-signature"></i>
                             </div>
                         </div>
                     </div>
                 </div>
             </section>

            {/* ========= Footer CTA ========= */}
            <section className="footerCtaStrip">
                <div className="container footerCtaInner">
                    <h3>Hazır mısınız?</h3>
                    <p>Pattern temelli öğrenme ile bilişsel hızınızı ve soyut düşünme becerinizi artırın.</p>
                    <Link
                        to={user ? getDashboardPath() : '/register'}
                        className={`ctaButton ${ctaHover ? 'hover' : ''}`}
                        onMouseEnter={() => setCtaHover(true)}
                        onMouseLeave={() => setCtaHover(false)}
                    >
                        {user ? 'Panelime Git' : 'Hemen Başla'} <i className="fas fa-arrow-right ms-2"></i>
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default HomePage;