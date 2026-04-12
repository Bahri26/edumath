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
import StudentProgressDashboard from './StudentProgressDashboard';

describe('StudentProgressDashboard', () => {
  it('renders main section', () => {
    render(<StudentProgressDashboard />);
    expect(screen.getByText(/ilerleme|progress/i)).toBeInTheDocument();
  });
});
