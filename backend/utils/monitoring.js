/** Optional server-side error monitoring — activates only when SENTRY_DSN is set. */
function initMonitoring() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || String(dsn).trim() === '') return null;

  try {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: String(dsn).trim(),
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    return Sentry;
  } catch (err) {
    console.warn('Sentry init skipped:', err.message);
    return null;
  }
}

module.exports = { initMonitoring };
