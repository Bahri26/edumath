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
import TeacherHome from './TeacherHome';

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: vi.fn((url) => {
      if (String(url).includes('dashboard-summary')) {
        return Promise.resolve({ data: { stats: { totalStudents: 0, classAverage: 0 }, reports: {} } });
      }
      if (String(url).includes('/teacher/students')) {
        return Promise.resolve({ data: { students: [] } });
      }
      return Promise.resolve({ data: {} });
    }),
  },
}));

describe('TeacherHome', () => {
  it('renders main section', async () => {
    render(
      <MemoryRouter>
        <TeacherHome />
      </MemoryRouter>
    );
    expect(await screen.findByText(/Hoşgeldiniz/i)).toBeInTheDocument();
  });
});
