import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import '../assets/styles/TeacherPages.css';
import '../assets/styles/Sidebar.css';

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/'].includes(location.pathname);

  return (
    <div className="app-container">
      {!isAuthPage && (
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
            aria-label="Toggle sidebar"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
        </>
      )}
      
      <div className={`main-wrapper ${!isAuthPage ? 'with-sidebar' : ''}`}>
        <Navbar />
        
        <main className="main-content">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}export default Layout;