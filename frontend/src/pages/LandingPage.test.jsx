// Mock IntersectionObserver for jsdom
beforeAll(() => {
  global.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import LandingPage from './LandingPage';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

describe('LandingPage', () => {
  it('renders navbar', () => {
    const mockAuth = { user: { name: 'Test User', role: 'student' }, logout: () => {} };
    render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuth}>
          <LandingPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
