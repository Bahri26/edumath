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
import { LanguageProvider } from '../../context/LanguageContext';
import StudentPracticeExercises from './StudentPracticeExercises';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
  registerApiErrorNotifier: vi.fn(),
}));

describe('StudentPracticeExercises', () => {
  it('renders main section', () => {
    render(
      <ToastProvider>
        <LanguageProvider>
          <StudentPracticeExercises />
        </LanguageProvider>
      </ToastProvider>
    );
    expect(screen.getByRole('heading', { name: /egzersiz|exercise/i })).toBeInTheDocument();
  });
});
