/**
 * AI sağlayıcı: local (varsayılan) | gemini | ollama
 * local = harici API yok; MongoDB + şablon bankası + Tesseract OCR + ml istatistik
 */
function getAiProvider() {
  const raw = String(process.env.AI_PROVIDER || 'local').trim().toLowerCase();
  if (raw === 'gemini' && String(process.env.GEMINI_API_KEY || '').trim()) {
    return 'gemini';
  }
  if (raw === 'ollama') {
    return 'ollama';
  }
  return 'local';
}

function isLocalAi() {
  return getAiProvider() === 'local';
}

function isGeminiAi() {
  return getAiProvider() === 'gemini';
}

function isOllamaAi() {
  return getAiProvider() === 'ollama';
}

module.exports = {
  getAiProvider,
  isLocalAi,
  isGeminiAi,
  isOllamaAi,
};
