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
import AdminSettings from './AdminSettings';

describe('AdminSettings', () => {
  it('renders main section', () => {
    render(<AdminSettings />);
    expect(screen.getByText(/ayar|setting/i)).toBeInTheDocument();
  });
});
