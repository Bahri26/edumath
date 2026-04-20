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
import { LanguageProvider } from '../../context/LanguageContext';
import StudentCourses from './StudentCourses';

describe('StudentCourses', () => {
  it('renders main section', () => {
    render(
      <LanguageProvider>
        <StudentCourses />
      </LanguageProvider>
    );
    expect(screen.getByRole('heading', { name: /ders|course/i })).toBeInTheDocument();
  });
});
