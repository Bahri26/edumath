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
import TeacherHome from './TeacherHome';

describe('TeacherHome', () => {
  it('renders main section', () => {
    render(<TeacherHome />);
    expect(screen.getByText(/öğretmen|teacher/i)).toBeInTheDocument();
  });
});
