import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import ResetPassword from './ResetPassword';
import { renderWithProviders } from '../../test/test-utils';

describe('ResetPassword', () => {
  it('renders main section', () => {
    renderWithProviders(<ResetPassword />);
    expect(screen.getByRole('heading', { name: /şifre sıfırla/i })).toBeInTheDocument();
  });
});
