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
import TeacherExerciseCreator from './TeacherExerciseCreator';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
  registerApiErrorNotifier: vi.fn(),
}));

describe('TeacherExerciseCreator', () => {
  it('renders main section', () => {
    render(
      <ToastProvider>
        <TeacherExerciseCreator />
      </ToastProvider>
    );
    expect(screen.getByRole('heading', { name: /egzersiz|exercise/i })).toBeInTheDocument();
  });
});
