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
import StudentPracticeExercises from './StudentPracticeExercises';

describe('StudentPracticeExercises', () => {
  it('renders main section', () => {
    render(<StudentPracticeExercises />);
    expect(screen.getByText(/egzersiz|exercise/i)).toBeInTheDocument();
  });
});
