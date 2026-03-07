import React, { useEffect, useState } from 'react';

const ErrorBanner = () => {
  const [err, setErr] = useState(null);

  useEffect(() => {
    function onError(e) {
      const d = e.detail || {};
      const message = (d.data && (d.data.error || d.data.message || JSON.stringify(d.data))) || `HTTP ${d.status} - ${d.url}`;
      setErr({ message, status: d.status });
    }
    window.addEventListener('api:error', onError);
    return () => window.removeEventListener('api:error', onError);
  }, []);

  if (!err) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      <div className="bg-red-50 dark:bg-red-900/80 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-100 rounded-xl p-3 shadow-lg flex items-center justify-between">
        <div className="text-sm">{err.message}</div>
        <div className="ml-4">
          <button onClick={() => setErr(null)} className="px-3 py-1 bg-red-100 dark:bg-red-800 rounded-lg text-sm">Kapat</button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBanner;
