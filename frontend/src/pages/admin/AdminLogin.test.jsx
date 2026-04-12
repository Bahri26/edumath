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
import AdminLogin from './AdminLogin';

describe('AdminLogin', () => {
  it('renders main section', () => {
    render(<AdminLogin />);
    expect(screen.getByText(/giriş|login/i)).toBeInTheDocument();
  });
});
