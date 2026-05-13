// Mock IntersectionObserver for jsdom
globalThis.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AdminResetRequests from './AdminResetRequests';

describe('AdminResetRequests', () => {
  it('renders main section', () => {
    render(<AdminResetRequests />);
    expect(screen.getByRole('heading', { name: /şifre sıfırlama talepleri/i })).toBeInTheDocument();
  });
});
