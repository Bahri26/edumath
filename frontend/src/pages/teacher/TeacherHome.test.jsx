// Mock IntersectionObserver for jsdom
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TeacherHome from './TeacherHome';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { render } from '@testing-library/react';

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: vi.fn((url) => {
      if (String(url).includes('dashboard-summary')) {
        return Promise.resolve({
          data: {
            stats: { totalStudents: 0, classAverage: 0, totalQuestions: 0, todayQuestions: 0, totalSurveys: 0, todaySurveys: 0, totalExams: 0, todayExams: 0, activeExams: 0 },
            reports: { topicPerformance: [], dailyTrend: [], recentQuestions: [], recentExams: [] },
          },
        });
      }
      if (String(url).includes('/teacher/students')) {
        return Promise.resolve({ data: { students: [] } });
      }
      return Promise.resolve({ data: {} });
    }),
  },
}));

const renderWithAuth = (user = { name: 'Ayşe Öğretmen', email: 'a@test.com' }) =>
  render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthContext.Provider value={{ user, login: vi.fn(), logout: vi.fn(), loading: false, sessionTimeout: 1 }}>
          <LanguageContext.Provider value={{ language: 'TR', setLanguage: () => {} }}>
            <TeacherHome />
          </LanguageContext.Provider>
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  );

describe('TeacherHome', () => {
  it('renders greeting with teacher name', async () => {
    renderWithAuth();
    expect(await screen.findByText(/Hoş geldiniz, Ayşe Öğretmen/i)).toBeInTheDocument();
  });
});
