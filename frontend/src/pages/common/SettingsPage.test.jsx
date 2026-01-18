
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import SettingsPage from './SettingsPage';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { name: 'Test', email: 'test@example.com', branch: '', grade: '', avatar: '' } })
  }
}));

describe('SettingsPage', () => {
  it('renders settings form', async () => {
    render(<SettingsPage role="student" />);
    expect(await screen.findByText(/öğrenci ayarları/i)).toBeInTheDocument();
  });
});
