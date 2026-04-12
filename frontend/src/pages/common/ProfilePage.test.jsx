
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ProfilePage from './ProfilePage';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { name: 'Test', email: 'test@example.com', branch: '', grade: '', avatar: '' } })
  }
}));

describe('ProfilePage', () => {
  it('renders profile info', async () => {
    render(<ProfilePage role="student" />);
    expect(await screen.findByDisplayValue('test@example.com')).toBeInTheDocument();
  });
});
