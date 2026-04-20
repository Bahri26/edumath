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
import { ToastProvider } from '../../context/ToastContext';
import TeacherExamsPage from './TeacherExamsPage';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
  registerApiErrorNotifier: vi.fn(),
}));

describe('TeacherExamsPage', () => {
  it('renders main section', () => {
    render(
      <ToastProvider>
        <TeacherExamsPage />
      </ToastProvider>
    );
    expect(screen.getByRole('heading', { name: /sınav|exam/i })).toBeInTheDocument();
  });
});
