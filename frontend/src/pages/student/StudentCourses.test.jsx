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
import StudentCourses from './StudentCourses';

describe('StudentCourses', () => {
  it('renders main section', () => {
    render(<StudentCourses />);
    expect(screen.getByText(/ders|course/i)).toBeInTheDocument();
  });
});
