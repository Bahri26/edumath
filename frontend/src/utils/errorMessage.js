/**
 * Sunucudan dönen hatadan kullanıcı dostu Türkçe mesaj çıkarır.
 * 429/timeout/network için özel kalıplar; aksi halde server message → fallback.
 */
export function describeApiError(err, fallback = 'İşlem tamamlanamadı.') {
  if (!err) return fallback;
  const status = err?.response?.status || err?.status;
  const data = err?.response?.data;
  const serverMessage = data?.message || err?.message || '';
  const hint = data?.hint;

  if (err?.code === 'ECONNABORTED') {
    return 'İstek zaman aşımına uğradı. Sunucu geç cevap veriyor.';
  }
  if (!err.response && err?.message?.toLowerCase()?.includes('network')) {
    return 'Ağ bağlantı hatası. İnternet/sunucu bağlantısını kontrol edin.';
  }
  if (status === 429) {
    const retryAfter = err?.response?.headers?.['retry-after'];
    const wait = retryAfter ? ` ${retryAfter} sn sonra tekrar deneyin.` : ' Bir süre sonra tekrar deneyin.';
    return `Kota/limit aşıldı.${wait}${hint ? ' ' + hint : ''}`;
  }
  if (status === 401) return 'Oturum süresi doldu. Yeniden giriş yapın.';
  if (status === 403) return 'Bu işlem için yetkiniz yok.';
  if (status === 404) return 'Kaynak bulunamadı.';
  if (status >= 500) return serverMessage || 'Sunucu hatası.';
  return serverMessage || fallback;
}
