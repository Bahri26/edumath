import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import NotFound from './NotFound';
import { renderWithProviders } from '../../test/test-utils';

describe('NotFound', () => {
  it('renders main section', () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByText(/bulunamadı|not found/i)).toBeInTheDocument();
  });
});
