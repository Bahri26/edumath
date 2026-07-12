import { useCallback, useEffect, useState } from 'react';
import apiClient from '../services/api';

/**
 * Okunmamış mesaj sayısı — panel başlığı ve menü rozetleri için.
 */
export default function useUnreadMessageCount({ enabled = true, pollMs = 60000 } = {}) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setUnreadCount(0);
      return 0;
    }
    try {
      const res = await apiClient.get('/messages/unread-count');
      const n = Number(res.data?.unreadCount ?? 0);
      const next = Number.isFinite(n) ? n : 0;
      setUnreadCount(next);
      return next;
    } catch {
      return 0;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0);
      return undefined;
    }
    refresh();
    const id = window.setInterval(refresh, pollMs);
    const onFocus = () => {
      refresh();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, pollMs, refresh]);

  return { unreadCount, refresh };
}
