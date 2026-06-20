import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import ExamsPage from './ExamsPage';
import { renderWithProviders } from '../../test/test-utils';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('../../context/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => ({ user: { role: 'teacher', id: '1', name: 'Test' } }),
  };
});

describe('ExamsPage', () => {
  it('renders main section', async () => {
    renderWithProviders(<ExamsPage role="teacher" />);
    expect(await screen.findByRole('heading', { name: /sınavlar/i })).toBeInTheDocument();
  });
});
