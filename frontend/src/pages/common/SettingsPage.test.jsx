import { describe, it, expect, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';
import { ThemeProvider } from '../../context/ThemeContext';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: vi.fn().mockImplementation((url) => {
      if (String(url).includes('notifications')) {
        return Promise.resolve({ data: { data: [], unreadCount: 0 } });
      }
      return Promise.resolve({
        data: {
          name: 'Test',
          email: 'test@example.com',
          branch: '',
          grade: '9. Sınıf',
          schoolType: 'lise',
          avatar: '',
          theme: 'light',
          notifications: true,
          language: 'TR',
        },
      });
    }),
    put: vi.fn().mockResolvedValue({}),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const wrap = (ui) =>
  render(
    <ThemeProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>,
  );

describe('SettingsPage', () => {
  it('renders student settings', async () => {
    wrap(<SettingsPage role="student" />);
    expect(await screen.findByText(/öğrenci ayarları/i)).toBeInTheDocument();
    expect(await screen.findByText(/Hesap bilgileri/i)).toBeInTheDocument();
  });

  it('renders teacher settings', async () => {
    wrap(<SettingsPage role="teacher" />);
    expect(await screen.findByText(/öğretmen ayarları/i)).toBeInTheDocument();
    expect(await screen.findByText(/Branş değişikliği/i)).toBeInTheDocument();
  });
});
