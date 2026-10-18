import React, { useContext } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { AuthContext, AuthProvider } from './AuthContext.jsx';
import { ToastProvider } from './ToastContext.jsx';
import { getBackendOrigin, registerAuthFailureHandler } from '../services/api.js';

afterEach(() => localStorage.clear());

function SessionState() {
  const { loading, user } = useContext(AuthContext);
  return <p>{loading ? 'Yükleniyor' : user ? 'Oturum açık' : 'Oturum yok'}</p>;
}

it('loads the real API exports and initializes authentication without a stored session', async () => {
  localStorage.clear();
  expect(typeof getBackendOrigin()).toBe('string');
  expect(typeof registerAuthFailureHandler).toBe('function');
  render(<ToastProvider><AuthProvider><SessionState /></AuthProvider></ToastProvider>);
  expect(await screen.findByText('Oturum yok')).toBeInTheDocument();
});
