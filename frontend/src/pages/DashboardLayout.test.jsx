import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import DashboardLayout from './DashboardLayout';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { LanguageContext } from '../context/LanguageContext.jsx';

const mockAuth = { user: { name: 'Test User', role: 'student' }, logout: () => {} };
const mockTheme = { isDarkMode: false, setIsDarkMode: () => {}, toggleTheme: () => {} };
const mockLanguage = { language: 'TR', setLanguage: () => {}, isEnglish: false };

const navMenuItems = [
  { id: 'home', label: 'Ana Sayfa', icon: () => null, path: '/student/home' },
  { id: 'courses', label: 'Derslerim', icon: () => null, path: '/student/courses' },
];

describe('DashboardLayout', () => {
  it('renders menu items without home link in top nav', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuth}>
          <ThemeContext.Provider value={mockTheme}>
            <LanguageContext.Provider value={mockLanguage}>
              <DashboardLayout role="student" navMenuItems={navMenuItems} />
            </LanguageContext.Provider>
          </ThemeContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.queryByText('Ana Sayfa')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Derslerim' }).length).toBeGreaterThan(0);
    expect(screen.queryByText('Matova')).not.toBeInTheDocument();
  });
});
