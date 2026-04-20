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
import ExamsPage from './ExamsPage';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
  registerApiErrorNotifier: vi.fn(),
}));

vi.mock('../../services/examService', () => ({
  createExam: vi.fn().mockResolvedValue({}),
}));

describe('ExamsPage', () => {
  it('renders main section', async () => {
    render(
      <ToastProvider>
        <ExamsPage />
      </ToastProvider>
    );
    expect(await screen.findByRole('heading', { name: /sınav|exam/i })).toBeInTheDocument();
  });
});
