// Mock IntersectionObserver for jsdom
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import StudentProgressDashboard from './StudentProgressDashboard';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { students: [], progress: [] } }),
  },
  registerApiErrorNotifier: vi.fn(),
}));

describe('StudentProgressDashboard', () => {
  it('renders main section', () => {
    render(<StudentProgressDashboard />);
    expect(screen.getByText(/öğrenci takibi/i)).toBeInTheDocument();
  });
});
