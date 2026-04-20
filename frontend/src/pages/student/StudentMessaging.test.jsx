// Mock IntersectionObserver for jsdom
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';
import StudentMessaging from './StudentMessaging';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
  registerApiErrorNotifier: vi.fn(),
}));

describe('StudentMessaging', () => {
  it('renders main section', () => {
    render(
      <ThemeProvider>
        <LanguageProvider>
          <StudentMessaging />
        </LanguageProvider>
      </ThemeProvider>
    );
    expect(screen.getByText(/mesaj|message/i)).toBeInTheDocument();
  });
});
