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
import AdminDashboard from './AdminDashboard';

vi.mock('../../services/adminService', () => ({
  default: {
    getAdminStats: vi.fn().mockResolvedValue({}),
    listResetRequests: vi.fn().mockResolvedValue([]),
    listUsers: vi.fn().mockResolvedValue([]),
  },
}));

describe('AdminDashboard', () => {
  it('renders main section', () => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );
    expect(screen.getByText(/admin|yönetici/i)).toBeInTheDocument();
  });
});
