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
import ExamsPage from './ExamsPage';

describe('ExamsPage', () => {
  it('renders main section', () => {
    render(<ExamsPage />);
    expect(screen.getByText(/sınav|exam/i)).toBeInTheDocument();
  });
});
