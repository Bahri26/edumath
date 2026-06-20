/** Optional error monitoring — activates only when VITE_SENTRY_DSN is set. */
export async function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || typeof dsn !== 'string' || !dsn.trim()) return null;

  try {
    const Sentry = await import('@sentry/react');
    Sentry.init({
      dsn: dsn.trim(),
      environment: import.meta.env.MODE,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      sendDefaultPii: false,
    });
    return Sentry;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('Sentry init skipped:', err?.message);
    }
    return null;
  }
}

export function captureException(error, context) {
  if (import.meta.env.DEV) {
    console.error('[monitoring]', error, context);
  }
  import('@sentry/react')
    .then((Sentry) => Sentry.captureException(error, { extra: context }))
    .catch(() => {});
}
