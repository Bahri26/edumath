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
import TeacherExerciseCreator from './TeacherExerciseCreator';

describe('TeacherExerciseCreator', () => {
  it('renders main section', () => {
    render(<TeacherExerciseCreator />);
    expect(screen.getByText(/egzersiz|exercise/i)).toBeInTheDocument();
  });
});
