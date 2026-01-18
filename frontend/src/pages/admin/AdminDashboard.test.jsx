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
import AdminDashboard from './AdminDashboard';

describe('AdminDashboard', () => {
  it('renders main section', () => {
    render(<AdminDashboard />);
    expect(screen.getByText(/admin|yönetici/i)).toBeInTheDocument();
  });
});
