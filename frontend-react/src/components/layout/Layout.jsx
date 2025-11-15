import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';
import './Sidebar.css';

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const isAuthPage = ['/login', '/register', '/'].includes(location.pathname);
  const isTeacherDashboard = location.pathname.startsWith('/teacher');
  const isStudentDashboard = location.pathname.startsWith('/student');
  const isProfilePage = location.pathname === '/profile';
  const isDashboard = isTeacherDashboard || isStudentDashboard || isProfilePage;
  // Sidebar sadece oturum açıkken gösterilsin
  const showSidebar = user && !isAuthPage;

  return (
    <div className="app-container">
      {showSidebar && (
        <>
          <Sidebar className={isSidebarOpen ? 'open' : ''} />
          {/* Overlay for mobile when sidebar is open */}
          <div
            className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
          />
          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-expanded={isSidebarOpen}
            aria-label="Menüyü aç/kapat"
            type="button"
          >
            {isSidebarOpen ? '❌' : '🎒'}
          </button>
        </>
      )}
      
      <div className={`main-wrapper ${showSidebar ? 'with-sidebar' : ''}`}>
        <Navbar />
        
        <main className="main-content">
          <Outlet />
        </main>

        {!isDashboard && <Footer />}
      </div>
    </div>
  );
}export default Layout;