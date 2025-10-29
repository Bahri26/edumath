// frontend-react/src/components/Layout.jsx (GÜNCEL HALİ - Footer Eklendi)

import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar'; 
import Footer from './Footer'; // <<< 1. Footer'ı import et

function Layout() {
  return (
    // <<< 2. Flexbox yapısını ayarla
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Üst Gezinme Çubuğu */}
      <Navbar />

      {/* Değişken Sayfa İçeriği Alanı */}
      {/* <<< 3. Main elementine flex: 1 ekle */}
      <main style={{ flex: 1, padding: '0' }}> 
        {/* Sayfa içerikleri artık kendi padding'lerini yönetmeli veya 
            buradaki padding'i ihtiyacınıza göre ayarlayın (örn: padding: '2rem') */}
        <Outlet /> 
      </main>

      {/* Alt Bilgi (Footer) */}
      {/* <<< 4. Footer bileşenini en alta ekle */}
      <Footer />
    </div>
  );
}

export default Layout;