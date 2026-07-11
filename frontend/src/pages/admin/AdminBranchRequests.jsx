import React, { useCallback, useEffect, useState } from 'react';
import { GraduationCap, Loader2, Search } from 'lucide-react';
import adminService from '../../services/adminService';
import AdminScrollHint from '../../components/admin/AdminScrollHint';
import { admin as a } from '../../components/admin/adminUi';

const AdminBranchRequests = () => {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listBranchRequests(q, page, limit);
      setItems(data.items || []);
      setPagination(data.pagination || { page, limit, total: 0 });
    } catch (err) {
      setError(err?.response?.data?.message || 'Liste alınamadı');
    } finally {
      setLoading(false);
    }
  }, [q, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className={a.pageWrap}>
      <header className="flex flex-wrap items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-teal-600 text-white shadow-lg shadow-sky-500/25">
          <GraduationCap className="h-6 w-6" />
        </span>
        <div>
          <p className={a.eyebrow}>Öğretmenler</p>
          <h1 className={a.title}>Branş onay talepleri</h1>
          <p className={a.subtitle}>Branş seçimini tamamlayıp onay bekleyen öğretmenleri buradan yönetin.</p>
        </div>
      </header>

      <div className={a.filterBar}>
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${a.input} pl-10`}
            placeholder="Ad, e-posta veya branş ara…"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
        </div>
      </div>

      {error && <div className={a.alertError}>{error}</div>}
      {info && <div className={a.alertOk}>{info.message}</div>}

      {loading ? (
        <div className={a.loadingBox}>
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-teal-600" />
          Liste yükleniyor…
        </div>
      ) : (
        <>
        <AdminScrollHint />
        <div className={a.tableWrap}>
          <table className={a.table}>
            <thead>
              <tr>
                <th className={a.th}>Ad</th>
                <th className={a.th}>E-posta</th>
                <th className={a.th}>Branş</th>
                <th className={a.th}>Tarih</th>
                <th className={`${a.th} text-right`}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it._id} className={a.tr}>
                  <td className={`${a.td} font-semibold text-slate-900 dark:text-white`}>{it.name}</td>
                  <td className={`${a.td} text-slate-600 dark:text-slate-300`}>{it.email}</td>
                  <td className={a.td}>
                    <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 dark:bg-teal-950/60 dark:text-teal-200">
                      {it.branch || '—'}
                    </span>
                  </td>
                  <td className={`${a.td} whitespace-nowrap text-xs text-slate-500`}>
                    {it.createdAt ? new Date(it.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className={`${a.td} text-right`}>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        className={a.btnSmSuccess}
                        onClick={async () => {
                          setInfo(null);
                          try {
                            const r = await adminService.approveBranch(it._id);
                            setInfo(r);
                            await load();
                          } catch (e) {
                            setError(e?.response?.data?.message || 'Onay hatası');
                          }
                        }}
                      >
                        Onayla
                      </button>
                      <button
                        type="button"
                        className={a.btnSmDanger}
                        onClick={async () => {
                          setInfo(null);
                          try {
                            const r = await adminService.denyBranch(it._id);
                            setInfo(r);
                            await load();
                          } catch (e) {
                            setError(e?.response?.data?.message || 'Reddetme hatası');
                          }
                        }}
                      >
                        Reddet
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className={`${a.td} py-12 text-center text-slate-500`} colSpan={5}>
                    Bekleyen branş talebi yok.
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
          Toplam <span className="tabular-nums text-slate-900 dark:text-white">{pagination.total}</span> · Sayfa{' '}
          <span className="tabular-nums">{pagination.page}</span>
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className={a.btnSecondary}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Önceki
          </button>
          <button
            type="button"
            className={a.btnSecondary}
            disabled={page * limit >= pagination.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Sonraki
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminBranchRequests;
