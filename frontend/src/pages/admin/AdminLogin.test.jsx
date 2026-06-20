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
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import AdminLogin from './AdminLogin';

const authValue = {
  user: null,
  login: () => {},
  logout: () => {},
  loading: false,
  sessionTimeout: 86400000,
};

const languageValue = { language: 'TR', setLanguage: () => {}, isEnglish: false };

describe('AdminLogin', () => {
  it('renders main section', () => {
    render(
      <MemoryRouter>
        <LanguageContext.Provider value={languageValue}>
          <AuthContext.Provider value={authValue}>
            <AdminLogin />
          </AuthContext.Provider>
        </LanguageContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /giriş yap/i })).toBeInTheDocument();
  });
});
