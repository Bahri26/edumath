import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageContext } from '../context/LanguageContext';
import { TestToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

const defaultLanguage = { language: 'TR', setLanguage: () => {} };
const defaultAuth = { user: null, login: () => {}, logout: () => {}, loading: false, sessionTimeout: 24 };

export function renderWithProviders(ui, options = {}) {
  const {
    languageValue = defaultLanguage,
    authValue = defaultAuth,
    route = '/',
  } = options;

  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <AuthContext.Provider value={authValue}>
          <LanguageContext.Provider value={languageValue}>
            <TestToastProvider>
              {ui}
            </TestToastProvider>
          </LanguageContext.Provider>
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}
