import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import TeacherExamsPage from './TeacherExamsPage';
import { renderWithProviders } from '../../test/test-utils';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn((url) => {
      if (String(url).includes('/teacher/subject/exams')) {
        return Promise.resolve({ data: [] });
      }
      if (String(url).includes('/users/profile')) {
        return Promise.resolve({ data: { branch: 'Matematik', branchApproval: 'approved' } });
      }
      return Promise.resolve({ data: [] });
    }),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe('TeacherExamsPage', () => {
  it('renders main section', async () => {
    renderWithProviders(<TeacherExamsPage />);
    expect(await screen.findByRole('heading', { name: /sınavlar/i })).toBeInTheDocument();
  });
});
