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
import AdminUsers from './AdminUsers';

vi.mock('../../services/adminService', () => ({
  default: {
    listUsers: vi.fn().mockResolvedValue({ items: [], pagination: { page: 1, limit: 10, total: 0 } }),
    listBranchRequests: vi.fn().mockResolvedValue({ items: [] }),
  },
}));

describe('AdminUsers', () => {
  it('renders main section', () => {
    render(<AdminUsers />);
    expect(screen.getByRole('heading', { name: /kullanıcı|user/i })).toBeInTheDocument();
  });
});
