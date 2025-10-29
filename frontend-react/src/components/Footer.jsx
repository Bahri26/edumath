// frontend-react/src/components/Footer.jsx (Bootstrap Sınıfı Kaldırıldı)

import React from 'react';
import { Link } from 'react-router-dom'; 
import styles from '../assets/styles/Footer.module.css'; 

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>

                <div className={styles.copyright}>
                    <small> 
                        <i className="fa-regular fa-copyright me-1"></i> {/* Font Awesome ikonu */}
                        {currentYear} Edu-Platform. Tüm Hakları Saklıdır.
                    </small>
                </div>

                {/* --- YENİ: Linkleri ve ikonları içeren bir div --- */}
                {/* CSS zaten flex direction'ı ayarladığı için ekstra d-flex'e gerek yok */}
                <div className={styles.footerRight}> 
                    <ul className={styles.links}>
                        <li><Link to="/about" className={styles.link}>Hakkımızda</Link></li> 
                        <li><Link to="/contact" className={styles.link}>İletişim</Link></li> 
                        <li><Link to="/privacy" className={styles.link}>Gizlilik</Link></li> 
                        <li><Link to="/terms" className={styles.link}>Koşullar</Link></li>  
                    </ul>

                    <ul className={styles.socialIcons}>
                        {/* ... (Sosyal ikon linkleri aynı kalır) ... */}
                        <li>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Twitter">
                                <i className="fab fa-twitter"></i>
                            </a>
                        </li>
                        <li>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
                                <i className="fab fa-facebook-f"></i>
                            </a>
                        </li>
                        <li>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="LinkedIn">
                                <i className="fab fa-linkedin-in"></i>
                            </a>
                        </li>
                         <li>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
                                <i className="fab fa-instagram"></i>
                            </a>
                        </li>
                    </ul>
                </div>
                {/* --- YENİ DİV SONU --- */}

            </div> 
        </footer> 
    );
};

export default Footer;