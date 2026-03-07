import { useEffect, useState } from 'react';
import api from '../services/api';

export const useTheme = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Listen for storage changes from other tabs/windows
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'theme' && e.newValue) {
                setTheme(e.newValue);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        
        // If a user object with token is stored, persist preference to backend
        try {
            const stored = localStorage.getItem('edumath_user');
            if (!stored) return;
            const parsed = JSON.parse(stored);
            if (!parsed || !parsed.token) return;
            await api.put('/users/theme', { theme: newTheme });
        } catch (error) {
            console.error('Tema tercihi kaydedilemedi:', error);
        }
    };

    return { theme, toggleTheme };
};
