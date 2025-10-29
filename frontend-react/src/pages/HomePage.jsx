// frontend-react/src/pages/HomePage.jsx (YAZMA ANİMASYONU KALDIRILDI - SON HALİ)

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/HomePage.css';
import assessmentImage from '../assets/images/abakus.jpg'; // Bu resmi assets/images altına eklediğinizden emin olun

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

    return (
        <div className="homePage">
            <Fireworks />
            {/* ========= Hero Section (Sola Yaslı Metin, STATİK BAŞLIK) ========= */}
            <section className="heroSection text-white">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-8 heroText text-center text-lg-start">
                            {/* Başlık artık statik */}
                            <h1 className="display-3 fw-bold mb-4 heroTitle">
                                Geleceğin Eğitim Platformuna<br />Hoş Geldiniz
                            </h1>
                            {/* Alt başlık (direkt görünür) */}
                            <p ref={subtitleRef} className="lead mb-5 heroSubtitle is-visible">
                                Bilgiyi keşfedin, becerilerinizi geliştirin ve potansiyelinizi bizimle ortaya çıkarın.
                            </p>
                            {/* Butonlar (direkt görünür) */}
                            <div ref={buttonsRef} className="heroButtons mt-4 d-flex flex-wrap justify-content-center justify-content-lg-start is-visible">
                                {user ? (
                                    <Link to={getDashboardPath()} className="btn btn-primary btn-lg me-sm-3 mb-2 mb-sm-0 shadow">
                                        <i className="fas fa-chart-line me-2"></i>Panelime Git
                                    </Link>
                                ) : (
                                    <Link to="/register" className="btn btn-success btn-lg me-sm-3 mb-2 mb-sm-0 shadow">
                                        <i className="fas fa-user-plus me-2"></i> Ücretsiz Başla
                                    </Link>
                                )}
                                <Link to="/teacher/classes" className="btn btn-outline-light btn-lg btnOutlineLight mt-2 mt-sm-0 shadow-sm">
                                    <i className="fas fa-search me-2"></i> Sınıfları Keşfet
                                </Link>
                            </div>
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

        </div> // .homePage kapanışı
    );
};

export default HomePage;