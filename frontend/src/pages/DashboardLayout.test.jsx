import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import DashboardLayout from './DashboardLayout';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { LanguageContext } from '../context/LanguageContext.jsx';

const mockAuth = { user: { name: 'Test User', role: 'student' }, logout: () => {} };
const mockTheme = { isDarkMode: false, setIsDarkMode: () => {} };
const mockLanguage = { language: 'TR' };

const navMenuItems = [
  { id: 'home', label: 'Ana Sayfa', icon: () => null, path: '/student/home' },
  { id: 'courses', label: 'Derslerim', icon: () => null, path: '/student/courses' },
];

describe('DashboardLayout', () => {
  it('renders menu items', () => {
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
    expect(screen.getByText('Ana Sayfa')).toBeInTheDocument();
    expect(screen.getByText('Derslerim')).toBeInTheDocument();
  });
});
