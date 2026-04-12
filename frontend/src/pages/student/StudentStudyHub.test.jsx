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
import StudentStudyHub from './StudentStudyHub';

describe('StudentStudyHub', () => {
  it('renders main section', () => {
    render(<StudentStudyHub />);
    expect(screen.getByText(/çalışma merkezi|study hub/i)).toBeInTheDocument();
  });
});
