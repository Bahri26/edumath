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
import TeacherExamsPage from './TeacherExamsPage';

describe('TeacherExamsPage', () => {
  it('renders main section', () => {
    render(<TeacherExamsPage />);
    expect(screen.getByText(/sınav|exam/i)).toBeInTheDocument();
  });
});
