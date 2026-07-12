import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import StudentHome from './StudentHome';
import { LanguageProvider } from '../../context/LanguageContext';
import { MemoryRouter } from 'react-router-dom';

describe('StudentHome', () => {
  it('renders welcome message and primary next action', () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <StudentHome />
        </LanguageProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/hoş geldin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/şimdi yap/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^başla$/i })).toBeInTheDocument();
  });

  it('renders compact progress status without mission cards', () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <StudentHome />
        </LanguageProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/seriyi başlat|gün seri/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kullanım kılavuzu/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /derse devam et/i })).not.toBeInTheDocument();
  });
});
