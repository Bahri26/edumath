function shouldDropKey(key) {
  if (typeof key !== 'string') return false;
  // MongoDB operator injection: $where, $ne, etc. and dotted paths
  return key.startsWith('$') || key.includes('.');
}

function sanitizeInPlace(value) {
  if (!value) return;

  if (Array.isArray(value)) {
    for (const item of value) sanitizeInPlace(item);
    return;
  }

  if (typeof value !== 'object') {
    return;
  }

  for (const key of Object.keys(value)) {
    if (shouldDropKey(key)) {
      delete value[key];
      continue;
    }
    sanitizeInPlace(value[key]);
  }
}

module.exports = function mongoSanitizeMiddleware(req, _res, next) {
  // Express 5 makes some request properties getter-only. We only mutate nested objects in place.
  try {
    sanitizeInPlace(req.body);
    sanitizeInPlace(req.params);
    sanitizeInPlace(req.query);
    // Headers are usually plain object; sanitizeing them can break legitimate headers, so skip by default.
  } catch {
    // Fail closed is too aggressive here; let validation/auth handle malformed inputs.
  }
  next();
};

