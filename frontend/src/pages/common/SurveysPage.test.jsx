
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import SurveysPage from './SurveysPage';
import { ToastProvider } from '../../context/ToastContext';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] })
  },
  registerApiErrorNotifier: vi.fn()
}));

const mockToast = { showToast: () => {} };

describe('SurveysPage', () => {
  it('renders surveys list', async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <SurveysPage role="student" />
        </ToastProvider>
      </MemoryRouter>
    );
    const ankets = await screen.findAllByText(/anket/i);
    expect(ankets.length).toBeGreaterThan(0);
  });
});
