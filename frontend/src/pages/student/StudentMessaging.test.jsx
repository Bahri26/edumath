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
import StudentMessaging from './StudentMessaging';

describe('StudentMessaging', () => {
  it('renders main section', () => {
    render(<StudentMessaging />);
    expect(screen.getByText(/mesaj|message/i)).toBeInTheDocument();
  });
});
