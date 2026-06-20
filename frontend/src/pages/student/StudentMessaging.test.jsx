import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import StudentMessaging from './StudentMessaging';
import { renderWithProviders } from '../../test/test-utils';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe('StudentMessaging', () => {
  it('renders main section', async () => {
    renderWithProviders(<StudentMessaging />);
    expect(await screen.findByText(/mesaj|message/i)).toBeInTheDocument();
  });
});
