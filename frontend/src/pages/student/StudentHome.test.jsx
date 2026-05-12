import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import StudentHome from './StudentHome';
import { LanguageProvider } from '../../context/LanguageContext';
import { MemoryRouter } from 'react-router-dom';

describe('StudentHome', () => {
  it('renders welcome message', () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <StudentHome />
        </LanguageProvider>
      </MemoryRouter>
    );
    expect(screen.getByText(/hoş geldin/i)).toBeInTheDocument();
  });
});
