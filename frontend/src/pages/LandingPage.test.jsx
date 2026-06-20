import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import LandingPage from './LandingPage';
import { renderWithProviders } from '../test/test-utils';

describe('LandingPage', () => {
  it('renders navbar', () => {
    renderWithProviders(<LandingPage />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
