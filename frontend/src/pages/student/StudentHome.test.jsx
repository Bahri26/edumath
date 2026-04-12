import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import StudentHome from './StudentHome';
import { LanguageProvider } from '../../context/LanguageContext';

describe('StudentHome', () => {
  it('renders welcome message', () => {
    render(
      <LanguageProvider>
        <StudentHome />
      </LanguageProvider>
    );
    expect(screen.getByText(/hoşgeldin/i)).toBeInTheDocument();
  });
});
