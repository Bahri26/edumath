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
import TeacherReports from './TeacherReports';

describe('TeacherReports', () => {
  it('renders main section', () => {
    render(<TeacherReports />);
    expect(screen.getByText(/rapor|report/i)).toBeInTheDocument();
  });
});
