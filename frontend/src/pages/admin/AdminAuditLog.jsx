import React, { useEffect, useState } from 'react';
import { Loader2, Shield } from 'lucide-react';
import adminService from '../../services/adminService';
import AdminScrollHint from '../../components/admin/AdminScrollHint';
import { admin as a } from '../../components/admin/adminUi';
import { useTranslation } from '../../i18n/useTranslation';

const AdminAuditLog = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [action, q]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminService.listAudits({ page, limit, action, q });
        if (cancelled) return;
        setItems(data.items || []);
        setTotal(data.pagination?.total ?? 0);
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Kayıtlar yüklenemedi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, limit, action, q]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className={a.pageWrap}>
      <header className="flex flex-wrap items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
          <Shield className="h-6 w-6" />
        </span>
        <div>
          <p className={a.eyebrow}>Uyumluluk</p>
          <h1 className={a.title}>Denetim günlüğü</h1>
          <p className={a.subtitle}>Yönetici işlemlerinin salt okunur kaydı. Arama ile e-posta veya işlem adına göre süzebilirsiniz.</p>
        </div>
      </header>

      <div className={a.filterBar}>
        <div className="min-w-[160px] flex-1">
          <label className={a.fieldLabel}>İşlem (action)</label>
          <input
            className={a.input}
            placeholder="örn. approve_user"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className={a.fieldLabel}>Metin ara</label>
          <input className={a.input} placeholder="E-posta veya action" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {error && <div className={a.alertError}>{error}</div>}

      {loading ? (
        <div className={a.loadingBox}>
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-violet-600" />
          Kayıtlar yükleniyor…
        </div>
      ) : (
        <>
        <AdminScrollHint />
        <div className={a.tableWrap}>
          <table className={a.table}>
            <thead>
              <tr>
                <th className={a.th}>Zaman</th>
                <th className={a.th}>İşlem</th>
                <th className={a.th}>Yapan</th>
                <th className={a.th}>Hedef e-posta</th>
                <th className={a.th}>Ek veri</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row._id} className={a.tr}>
                  <td className={`${a.td} whitespace-nowrap font-mono text-xs text-slate-500`}>
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className={a.td}>
                    <code className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-violet-800 dark:bg-slate-800 dark:text-violet-300">
                      {row.action}
                    </code>
                  </td>
                  <td className={`${a.td} text-slate-700 dark:text-slate-200`}>
                    {row.actorId
                      ? [row.actorId.name, row.actorId.email].filter(Boolean).join(' · ') || '—'
                      : '—'}
                  </td>
                  <td className={`${a.td} font-medium`}>{row.targetEmail || '—'}</td>
                  <td
                    className={`${a.td} max-w-[220px] truncate font-mono text-[11px] text-slate-500`}
                    title={JSON.stringify(row.metadata || {})}
                  >
                    {row.metadata && Object.keys(row.metadata).length ? JSON.stringify(row.metadata) : '—'}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className={`${a.td} py-12 text-center text-slate-500`} colSpan={5}>
                    Bu kriterlere uygun kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/50">
        <span className="font-medium text-slate-600 dark:text-slate-300">
          {t('admin.paginationRecords', { total, page, pages: totalPages })}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className={a.btnSecondary}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('admin.prev')}
          </button>
          <button
            type="button"
            className={a.btnSecondary}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('admin.next')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAuditLog;
