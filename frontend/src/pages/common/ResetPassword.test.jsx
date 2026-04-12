// Mock IntersectionObserver for jsdom
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ResetPassword from './ResetPassword';

describe('ResetPassword', () => {
  it('renders main section', () => {
    render(<ResetPassword />);
    expect(screen.getByText(/şifre|password/i)).toBeInTheDocument();
  });
});
