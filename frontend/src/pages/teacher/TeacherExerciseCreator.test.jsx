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
import TeacherExerciseCreator from './TeacherExerciseCreator';
import apiClient from '../../services/api';

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    delete: vi.fn(),
    post: vi.fn(),
  },
  resolveAssetUrl: (u) => u || '',
}));

describe('TeacherExerciseCreator', () => {
  beforeEach(() => {
    apiClient.get.mockResolvedValue({
      data: { data: [], totalPages: 1, page: 1, total: 0 },
    });
  });

  it('renders main section', async () => {
    render(<TeacherExerciseCreator />);
    expect(await screen.findByRole('heading', { name: /egzersizler/i })).toBeInTheDocument();
  });
});
