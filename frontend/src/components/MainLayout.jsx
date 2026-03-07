import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useTheme } from '../hooks/useTheme';
import ErrorBanner from './common/ErrorBanner';

const MainLayout = () => {
    const { theme } = useTheme();

    const { pathname } = useLocation();
    // Show footer on the homepage route (accept both '/' and '/home' for compatibility)
    const showFooter = pathname === '/' || pathname === '/home';

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* 1. NAVBAR (Her Yerde Var) */}
            <Navbar />

            <ErrorBanner />

            {/* 2. İÇERİK (Değişken) - make main full-width; individual pages should center with max-w-7xl when needed */}
            <main className="flex-1 w-full p-4 md:p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
                <Outlet />
            </main>

            {/* Global footer rendered here so it spans full width but content aligns with site container */}
            {showFooter && <Footer />}

        </div>
    );
};

export default MainLayout;
