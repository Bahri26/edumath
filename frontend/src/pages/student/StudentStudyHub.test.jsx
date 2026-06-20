import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import StudentStudyHub from './StudentStudyHub';
import { renderWithProviders } from '../../test/test-utils';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { data: [] } })),
  },
}));

describe('StudentStudyHub', () => {
  it('renders main section', async () => {
    renderWithProviders(<StudentStudyHub />);
    expect(await screen.findByText(/çalışma merkezi/i)).toBeInTheDocument();
  });
});
