/**
 * Keyword-based guest FAQ replies (no API auth required).
 * @param {string} text - User message
 * @param {'TR'|'EN'} lang
 * @param {Record<string, string>} replies - from messages.chat.guestReplies
 */
export function getGuestChatReply(text, lang, replies) {
  const q = String(text || '').toLowerCase().trim();
  if (!q) return replies.default;

  const isTr = lang === 'TR';

  if (
    /kayıt|kayit|register|sign\s*up|üye|uye/.test(q)
  ) {
    return replies.register;
  }
  if (/giriş|giris|login|sign\s*in|oturum/.test(q)) {
    return replies.login;
  }
  if (
    /alıştırma|alistirma|egzersiz|exercise|practice|çalış|calis|study/.test(q)
  ) {
    return replies.exercise;
  }
  if (/öğretmen|ogretmen|teacher|sınav|sinav|exam|soru bank/.test(q)) {
    return replies.teacher;
  }
  if (/merhaba|hello|hi|selam|hey/.test(q) && q.length < 20) {
    return isTr
      ? 'Merhaba! Kayıt, giriş veya alıştırmalar hakkında sorabilirsiniz.'
      : 'Hello! Ask about signup, login, or practice exercises.';
  }

  return replies.default;
}
