/**
 * Axios hatalarından kullanıcıya gösterilecek kısa Türkçe mesaj üretir.
 * @param {import('axios').AxiosError} err
 * @returns {{ message: string, code?: string }}
 */
export function getFriendlyApiError(err) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const code = typeof data?.code === 'string' ? data.code : undefined;
  const rawMsg = typeof data?.message === 'string' ? data.message.trim() : '';
  const details = data?.details;

  if (err?.code === 'ECONNABORTED') {
    return {
      message:
        'İşlem zaman aşımına uğradı. Sunucu geç yanıt veriyor; bir süre sonra tekrar deneyin.',
      code: 'TIMEOUT',
    };
  }

  if (!err?.response) {
    return {
      message: 'Sunucuya ulaşılamıyor. Bağlantınızı ve API adresini kontrol edin.',
      code: 'NETWORK',
    };
  }

  if (code === 'DB_NOT_READY') {
    return {
      message: rawMsg || 'Sunucu hazırlanıyor; birkaç saniye sonra tekrar deneyin.',
      code,
    };
  }

  if (Array.isArray(details) && details.length > 0) {
    const joined = details
      .map((d) => (typeof d?.message === 'string' ? d.message : ''))
      .filter(Boolean)
      .join('\n');
    if (joined) {
      return { message: joined, code };
    }
  }

  const codeHints = {
    AUTH_NO_PASSWORD: 'Bu hesap için şifre ile giriş tanımlı değil.',
    AUTH_VERIFY_FAILED: 'Giriş doğrulanamadı. Tekrar deneyin veya yöneticiyle iletişime geçin.',
    AUTH_SESSION_STORE_FAILED: 'Oturum kaydedilemedi. Lütfen tekrar deneyin.',
    LOGIN_INTERNAL: 'Giriş sırasında beklenmeyen bir sorun oluştu. Lütfen tekrar deneyin.',
  };

  if (code && codeHints[code]) {
    return { message: codeHints[code], code };
  }

  if (rawMsg) {
    const trustedServerCodes = new Set([
      'DB_NOT_READY',
      'LOGIN_INTERNAL',
      'AUTH_VERIFY_FAILED',
      'AUTH_SESSION_STORE_FAILED',
      'AUTH_NO_PASSWORD',
      'REGISTER_INTERNAL',
    ]);
    if (status >= 500 && import.meta.env.PROD && !(code && trustedServerCodes.has(code))) {
      return { message: 'Sunucu hatası. Lütfen bir süre sonra tekrar deneyin.', code: code || 'SERVER' };
    }
    return { message: rawMsg, code };
  }

  if (status === 400) {
    return { message: 'İstek geçersiz. Alanları kontrol edin.', code };
  }
  if (status === 403) {
    return { message: 'Bu işlem için yetkiniz yok veya hesap kısıtlı.', code };
  }
  if (status === 404) {
    return { message: 'İstenen kaynak bulunamadı.', code };
  }
  if (status === 429) {
    return { message: 'Çok fazla deneme. Lütfen bir süre sonra tekrar deneyin.', code };
  }
  if (status === 503) {
    return { message: 'Sunucu geçici olarak kullanılamıyor. Kısa süre sonra tekrar deneyin.', code };
  }
  if (status >= 500) {
    return { message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.', code: code || 'SERVER' };
  }

  return { message: 'Bir hata oluştu. Lütfen tekrar deneyin.', code };
}
