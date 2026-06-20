import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Search,
  Star,
  Trash2,
  User,
} from 'lucide-react';
import adminService from '../../services/adminService';
import AdminTableEmpty from '../../components/admin/AdminTableEmpty';
import { admin as a } from '../../components/admin/adminUi';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import { useTranslation } from '../../i18n/useTranslation';

const CATEGORY_BADGE = {
  auth: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300',
  content: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  learning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  admin: 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300',
  system: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export default function AdminUserActivity() {
  const { t, language } = useTranslation();
  const dateLocale = language === 'EN' ? 'en-US' : 'tr-TR';
  const { askConfirm, ConfirmDialog } = useConfirmAction();

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('admin.activity.categoryAll') },
      { value: 'auth', label: t('admin.activity.categories.auth') },
      { value: 'content', label: t('admin.activity.categories.content') },
      { value: 'learning', label: t('admin.activity.categories.learning') },
      { value: 'admin', label: t('admin.activity.categories.admin') },
      { value: 'system', label: t('admin.activity.categories.system') },
    ],
    [t],
  );

  const roleLabel = (role) => t(`admin.roles.${role}`) || role || '—';
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [category, setCategory] = useState('');
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [q, setQ] = useState('');
  const [watchOnly, setWatchOnly] = useState(false);

  const [summary, setSummary] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [watchLoading, setWatchLoading] = useState(false);
  const [addUserId, setAddUserId] = useState('');
  const [addNote, setAddNote] = useState('');

  const loadWatchlist = useCallback(async () => {
    setWatchLoading(true);
    try {
      const data = await adminService.listWatchlist();
      setWatchlist(data.items || []);
    } catch {
      setWatchlist([]);
    } finally {
      setWatchLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatchlist();
    adminService.getActivitySummary().then(setSummary).catch(() => setSummary(null));
  }, [loadWatchlist]);

  useEffect(() => {
    setPage(1);
  }, [category, action, userId, q, watchOnly]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminService.listActivities({
          page,
          limit,
          category,
          action,
          userId,
          q,
          watchOnly,
        });
        if (cancelled) return;
        setItems(data.items || []);
        setTotal(data.pagination?.total ?? 0);
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || t('admin.activity.errLoad'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, limit, category, action, userId, q, watchOnly]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleAddWatch = async (e) => {
    e.preventDefault();
    if (!addUserId.trim()) return;
    try {
      await adminService.addToWatchlist(addUserId.trim(), addNote.trim());
      setAddUserId('');
      setAddNote('');
      await loadWatchlist();
    } catch (err) {
      setError(err?.response?.data?.message || t('admin.activity.errWatch'));
    }
  };

  const handleRemoveWatch = async (uid) => {
    const confirmed = await askConfirm({
      title: t('admin.activity.removeWatchTitle'),
      description: t('admin.activity.removeWatchDesc'),
    });
    if (!confirmed) return;
    try {
      await adminService.removeFromWatchlist(uid);
      await loadWatchlist();
      if (userId === String(uid)) setUserId('');
    } catch (err) {
      setError(err?.response?.data?.message || t('admin.activity.errUnwatch'));
    }
  };

  const filterByUser = (uid) => {
    setUserId(String(uid));
    setWatchOnly(false);
    setPage(1);
  };

  return (
    <div className={a.pageWrap}>
      <header className="flex flex-wrap items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
          <Activity className="h-6 w-6" />
        </span>
        <div className="flex-1 min-w-0">
          <p className={a.eyebrow}>{t('admin.activity.eyebrow')}</p>
          <h1 className={a.title}>{t('admin.activity.title')}</h1>
          <p className={a.subtitle}>{t('admin.activity.subtitle')}</p>
          {summary && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {t('admin.activity.last24h', { n: summary.last24h })}
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                {t('admin.activity.watchedUsers', { n: summary.watchedUsers })}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className={`${a.cardSoft} space-y-4 p-4`}>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">{t('admin.activity.watchlistTitle')}</h2>
          </div>

          <form onSubmit={handleAddWatch} className="space-y-2">
            <label className={a.fieldLabel}>{t('admin.activity.userId')}</label>
            <input
              className={a.inputCompact}
              placeholder={t('admin.activity.userIdPlaceholder')}
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
            />
            <input
              className={a.inputCompact}
              placeholder={t('admin.activity.noteOptional')}
              value={addNote}
              onChange={(e) => setAddNote(e.target.value)}
            />
            <button type="submit" className={`${a.btnSmPrimary} w-full justify-center`}>
              <Plus className="h-3.5 w-3.5" />
              {t('admin.activity.addWatch')}
            </button>
          </form>

          {watchLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            </div>
          ) : watchlist.length === 0 ? (
            <p className="text-xs text-slate-500">{t('admin.activity.watchEmpty')}</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {watchlist.map((w) => {
                const u = w.userId;
                const uid = u?._id || w.userId;
                return (
                  <li
                    key={w._id}
                    className="rounded-xl border border-slate-200/80 bg-white/80 p-2.5 dark:border-slate-700 dark:bg-slate-900/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        className="text-left text-sm font-medium text-slate-800 hover:text-violet-600 dark:text-slate-100"
                        onClick={() => filterByUser(uid)}
                      >
                        {u?.name || '—'}
                        <span className="block text-[11px] font-normal text-slate-500">{u?.email}</span>
                      </button>
                      <button
                        type="button"
                        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Takipten çıkar"
                        onClick={() => handleRemoveWatch(uid)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {w.note ? <p className="mt-1 text-[11px] text-slate-500 italic">{w.note}</p> : null}
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            className={`${a.btnSmOutline} w-full justify-center`}
            onClick={() => {
              setWatchOnly((v) => !v);
              setPage(1);
            }}
          >
            {watchOnly ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {watchOnly ? t('admin.activity.showAll') : t('admin.activity.watchOnly')}
          </button>
        </aside>

        <div className="space-y-4 min-w-0">
          <div className={a.filterBar}>
            <div className="min-w-[140px] flex-1">
              <label className={a.fieldLabel}>{t('admin.activity.category')}</label>
              <select className={a.select} value={category} onChange={(e) => setCategory(e.target.value)}>
                {categoryOptions.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[120px] flex-1">
              <label className={a.fieldLabel}>{t('admin.activity.action')}</label>
              <input
                className={a.input}
                placeholder={t('admin.activity.actionPlaceholder')}
                value={action}
                onChange={(e) => setAction(e.target.value)}
              />
            </div>
            <div className="min-w-[140px] flex-1">
              <label className={a.fieldLabel}>{t('admin.activity.filterUserId')}</label>
              <input
                className={a.input}
                placeholder={t('admin.activity.filterUserPlaceholder')}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div className="min-w-[160px] flex-[1.5]">
              <label className={a.fieldLabel}>{t('admin.activity.search')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className={`${a.input} pl-9`}
                  placeholder={t('admin.activity.searchPlaceholder')}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>
            {(userId || category || action || q || watchOnly) && (
              <div className="flex items-end">
                <button
                  type="button"
                  className={a.btnSecondary}
                  onClick={() => {
                    setCategory('');
                    setAction('');
                    setUserId('');
                    setQ('');
                    setWatchOnly(false);
                  }}
                >
                  {t('admin.clear')}
                </button>
              </div>
            )}
          </div>

          {error && <div className={a.alertError}>{error}</div>}

          {loading ? (
            <div className={a.loadingBox}>
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-violet-600" />
              {t('admin.activity.loading')}
            </div>
          ) : items.length === 0 ? (
            <AdminTableEmpty title={t('admin.activity.emptyTitle')} description={t('admin.activity.emptyDesc')} />
          ) : (
            <>
              <div className={a.mobileCardList}>
                {items.map((row) => {
                  const pop = row.userId && typeof row.userId === 'object' ? row.userId : null;
                  const displayName = pop?.name || row.userName || '—';
                  const displayEmail = pop?.email || row.userEmail || '';
                  const displayRole = pop?.role || row.userRole;
                  return (
                    <article key={row._id} className={a.mobileCard}>
                      <p className="font-mono text-xs text-slate-500">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString(dateLocale) : '—'}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                          <User className="h-4 w-4 text-slate-500" />
                        </span>
                        <div className="min-w-0">
                          <button
                            type="button"
                            className="truncate text-left text-sm font-medium text-slate-800 hover:text-violet-600 dark:text-slate-100"
                            onClick={() => filterByUser(pop?._id || row.userId)}
                          >
                            {displayName}
                          </button>
                          <div className="truncate text-[11px] text-slate-500">{displayEmail}</div>
                          {displayRole ? (
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              {roleLabel(displayRole)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div>
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            CATEGORY_BADGE[row.category] || CATEGORY_BADGE.system
                          }`}
                        >
                          {row.category}
                        </span>
                        <code className="mt-1 block text-[10px] text-slate-400">{row.action}</code>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200">{row.summary}</p>
                      <p className="text-xs text-slate-500">
                        {row.targetLabel || row.targetType || '—'}
                        {row.ip ? ` · ${row.ip}` : ''}
                      </p>
                    </article>
                  );
                })}
              </div>

              <div className={a.tableDesktopOnly}>
                <div className={a.tableWrap}>
                  <table className={a.table}>
                    <thead>
                      <tr>
                        <th className={a.thSticky}>{t('admin.activity.colTime')}</th>
                        <th className={a.th}>{t('admin.activity.colUser')}</th>
                        <th className={a.th}>{t('admin.activity.colCategory')}</th>
                        <th className={a.th}>{t('admin.activity.colSummary')}</th>
                        <th className={a.th}>{t('admin.activity.colTarget')}</th>
                        <th className={a.th}>{t('admin.activity.colIp')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row) => {
                        const pop = row.userId && typeof row.userId === 'object' ? row.userId : null;
                        const displayName = pop?.name || row.userName || '—';
                        const displayEmail = pop?.email || row.userEmail || '';
                        const displayRole = pop?.role || row.userRole;
                        return (
                          <tr key={row._id} className={a.tr}>
                            <td className={`${a.tdSticky} whitespace-nowrap font-mono text-xs text-slate-500`}>
                              {row.createdAt ? new Date(row.createdAt).toLocaleString(dateLocale) : '—'}
                            </td>
                            <td className={a.td}>
                              <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                                  <User className="h-4 w-4 text-slate-500" />
                                </span>
                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    className="truncate text-left text-sm font-medium text-slate-800 hover:text-violet-600 dark:text-slate-100"
                                    onClick={() => filterByUser(pop?._id || row.userId)}
                                  >
                                    {displayName}
                                  </button>
                                  <div className="truncate text-[11px] text-slate-500">{displayEmail}</div>
                                  {displayRole ? (
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                      {roleLabel(displayRole)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                            <td className={a.td}>
                              <span
                                className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                  CATEGORY_BADGE[row.category] || CATEGORY_BADGE.system
                                }`}
                              >
                                {row.category}
                              </span>
                              <code className="mt-1 block text-[10px] text-slate-400">{row.action}</code>
                            </td>
                            <td className={`${a.td} max-w-[240px] text-sm text-slate-700 dark:text-slate-200`}>
                              {row.summary}
                            </td>
                            <td className={`${a.td} text-xs text-slate-500`}>
                              {row.targetLabel || row.targetType || '—'}
                            </td>
                            <td className={`${a.td} font-mono text-[10px] text-slate-400`}>{row.ip || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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
      </div>
      <ConfirmDialog />
    </div>
  );
}
