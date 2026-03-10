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
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AdminLogin from './AdminLogin';

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('AdminLogin', () => {
  it('renders main section', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ login: vi.fn(), user: null }}>
          <AdminLogin />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /giriş|login/i })).toBeInTheDocument();
  });
});
