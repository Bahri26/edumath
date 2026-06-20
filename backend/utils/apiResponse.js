/**
 * Standart API yanıt zarfı — yeni uç noktalarda ve errorHandler ile uyumlu.
 * Mevcut rotalar kademeli olarak buna geçirilebilir.
 */
function sendSuccess(res, data = null, options = {}) {
  const { message, status = 200 } = options;
  const body = { success: true };
  if (message) body.message = message;
  if (data !== null && data !== undefined) body.data = data;
  return res.status(status).json(body);
}

function sendError(res, message, options = {}) {
  const { status = 400, code, details } = options;
  const body = { success: false, message: message || 'İstek işlenemedi.' };
  if (code) body.code = code;
  if (details) body.details = details;
  return res.status(status).json(body);
}

module.exports = {
  sendSuccess,
  sendError,
};
