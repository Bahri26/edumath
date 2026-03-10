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
import { LanguageProvider } from '../../context/LanguageContext';
import StudentLeaderboard from './StudentLeaderboard';

describe('StudentLeaderboard', () => {
  it('renders main section', () => {
    render(
      <LanguageProvider>
        <StudentLeaderboard />
      </LanguageProvider>
    );
    expect(screen.getByText(/sıralama|leaderboard/i)).toBeInTheDocument();
  });
});
