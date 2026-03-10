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
import TeacherHome from './TeacherHome';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
  registerApiErrorNotifier: vi.fn(),
}));

describe('TeacherHome', () => {
  it('renders main section', () => {
    render(
      <ToastProvider>
        <TeacherHome />
      </ToastProvider>
    );
    expect(screen.getByText(/hoşgeldiniz|hocam/i)).toBeInTheDocument();
  });
});
