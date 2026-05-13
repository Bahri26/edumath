// Mock IntersectionObserver for jsdom
globalThis.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AdminUsers from './AdminUsers';

describe('AdminUsers', () => {
  it('renders main section', () => {
    render(<AdminUsers />);
    expect(screen.getByRole('heading', { name: /Kullanıcı Onayları/i })).toBeInTheDocument();
  });
});
