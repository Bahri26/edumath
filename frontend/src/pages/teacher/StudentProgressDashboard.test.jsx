// Mock IntersectionObserver for jsdom
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StudentProgressDashboard from './StudentProgressDashboard';
import { LanguageProvider } from '../../context/LanguageContext';
import { ToastProvider } from '../../context/ToastContext';

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: vi.fn(() => Promise.resolve({ data: { students: [] } })),
  },
  registerApiErrorNotifier: vi.fn(),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <ToastProvider>
          <StudentProgressDashboard />
        </ToastProvider>
      </LanguageProvider>
    </MemoryRouter>
  );

describe('StudentProgressDashboard', () => {
  it('renders main heading', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: /öğrenci takibi/i })).toBeInTheDocument();
  });
});
