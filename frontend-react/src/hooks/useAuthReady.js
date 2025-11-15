// frontend-react/src/hooks/useAuthReady.js
import { useEffect, useState } from 'react';

/**
 * Returns true when both token and user are present in localStorage (or absence settled)
 * Prevents premature protected fetches before AuthContext finishes hydrating.
 */
export default function useAuthReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // microtask defer to allow AuthContext initial effect run
    const t = setTimeout(() => {
      const token = localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');
      // Ready if we either have a token+user or definitively don't (so components can decide redirect)
      setReady(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return ready;
}
