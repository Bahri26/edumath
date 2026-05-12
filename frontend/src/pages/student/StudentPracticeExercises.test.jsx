// Mock IntersectionObserver for jsdom
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '../../context/LanguageContext';
import StudentPracticeExercises from './StudentPracticeExercises';
import apiClient from '../../services/api';

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

function renderWithLang(ui) {
  return render(<LanguageProvider>{ui}</LanguageProvider>);
}

describe('StudentPracticeExercises', () => {
  beforeEach(() => {
    apiClient.get.mockResolvedValue({
      data: { data: [], totalPages: 1, page: 1, total: 0 },
    });
  });

  it('renders main section', async () => {
    renderWithLang(<StudentPracticeExercises />);
    expect(await screen.findByRole('heading', { name: /eğlenceli egzersizler/i })).toBeInTheDocument();
  });
});
