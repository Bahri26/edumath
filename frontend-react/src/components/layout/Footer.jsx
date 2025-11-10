import React from 'react';
import { Link } from 'react-router-dom'; 
import '../../assets/styles/Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="kids-footer">
            {/* Üst Bölüm */}
            <div className="footer-top">
                <div className="footer-container">
                    {/* Logo ve Açıklama */}
                    <div className="footer-section">
                        <div className="footer-logo">
                            <span className="footer-logo-icon">🎯</span>
                            <h3>Örüntü Macera</h3>
                        </div>
                        <p className="footer-description">
                            Matematiği eğlenceli hale getiren, çocukların örüntüleri keşfettiği muhteşem bir öğrenme platformu! 🚀
                        </p>
                        <div className="footer-badges">
                            <span className="badge">🏆 1000+ Öğrenci</span>
                            <span className="badge">⭐ 4.9/5</span>
                        </div>
                    </div>

                    {/* Hızlı Linkler */}
                    <div className="footer-section">
                        <h4 className="footer-title">🔗 Hızlı Linkler</h4>
                        <ul className="footer-links">
                            <li><Link to="/">🏠 Ana Sayfa</Link></li>
                            <li><Link to="/about">ℹ️ Hakkımızda</Link></li>
                            <li><Link to="/contact">📧 İletişim</Link></li>
                            <li><Link to="/student/dashboard">📚 Öğrenci Paneli</Link></li>
                        </ul>
                    </div>

                    {/* Destek */}
                    <div className="footer-section">
                        <h4 className="footer-title">🆘 Destek</h4>
                        <ul className="footer-links">
                            <li><Link to="/help">❓ Yardım Merkezi</Link></li>
                            <li><Link to="/privacy">🔒 Gizlilik</Link></li>
                            <li><Link to="/terms">📜 Koşullar</Link></li>
                            <li><Link to="/faq">💬 SSS</Link></li>
                        </ul>
                    </div>

                    {/* Bize Ulaşın */}
                    <div className="footer-section">
                        <h4 className="footer-title">📞 Bize Ulaşın</h4>
                        <div className="contact-info">
                            <p>
                                <span className="contact-icon">📧</span>
                                <a href="mailto:info@oruntumaçera.com">info@oruntumacera.com</a>
                            </p>
                            <p>
                                <span className="contact-icon">📱</span>
                                <a href="tel:+905551234567">+90 555 123 45 67</a>
                            </p>
                        </div>
                        
                        {/* Sosyal Medya */}
                        <div className="social-media">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link facebook" aria-label="Facebook">
                                <i className="fab fa-facebook-f"></i>
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link twitter" aria-label="Twitter">
                                <i className="fab fa-twitter"></i>
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link instagram" aria-label="Instagram">
                                <i className="fab fa-instagram"></i>
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-link youtube" aria-label="YouTube">
                                <i className="fab fa-youtube"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alt Bölüm */}
            <div className="footer-bottom">
                <div className="footer-container">
                    <p className="copyright">
                        <span className="heart">💜</span> {currentYear} Örüntü Macera. Tüm hakları saklıdır.
                    </p>
                    <p className="made-with">
                        Çocuklar için <span className="emoji">✨</span> sevgiyle yapıldı
                    </p>
                </div>
            </div>

            {/* Dekoratif Elementler */}
            <div className="footer-decoration">
                <span className="deco-shape shape-1">⭐</span>
                <span className="deco-shape shape-2">🌟</span>
                <span className="deco-shape shape-3">✨</span>
                <span className="deco-shape shape-4">💫</span>
            </div>
        </footer>
    );
};

export default Footer;