import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, UserPlus, UsersRound } from 'lucide-react';
import adminService from '../../services/adminService';
import AdminInternalNotesPanel from '../../components/admin/AdminInternalNotesPanel';
import AdminTableEmpty from '../../components/admin/AdminTableEmpty';
import { admin as a } from '../../components/admin/adminUi';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import { useTranslation } from '../../i18n/useTranslation';

const AdminUsers = () => {
  const { t, language } = useTranslation();
  const { askConfirm, ConfirmDialog } = useConfirmAction();
  const dateLocale = language === 'EN' ? 'en-US' : 'tr-TR';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tempPwByUser, setTempPwByUser] = useState({});
  const [status, setStatus] = useState('pending');
  const [role, setRole] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [info, setInfo] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    grade: '9. Sınıf',
    branch: '',
    status: 'pending',
  });
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [notesUserId, setNotesUserId] = useState(null);

  const roleLabel = (r) => t(`admin.roles.${r}`) || r;
  const statusLabel = (s) => t(`admin.status.${s}`) || s;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listUsers(status, role, q, page, limit);
      setItems(data.items);
      setPagination(data.pagination || { page, limit, total: data.items?.length || 0 });
    } catch (err) {
      setError(err?.response?.data?.message || t('admin.users.errList'));
    } finally {
      setLoading(false);
    }
  }, [status, role, q, page, limit, t]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id) => {
    setInfo(null);
    try {
      const tempPw = tempPwByUser[id] || undefined;
      const data = await adminService.approveUser(id, tempPw);
      setInfo(data);
      setTempPwByUser((prev) => ({ ...prev, [id]: '' }));
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || t('admin.users.errApprove'));
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    try {
      const payload = { ...createData };
      if (payload.role !== 'student') delete payload.grade;
      if (payload.role !== 'teacher') delete payload.branch;
      const resp = await adminService.createUser(payload);
      setInfo(resp);
      setShowCreate(false);
      setCreateData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        grade: '9. Sınıf',
        branch: '',
        status: 'pending',
      });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || t('admin.users.errCreate'));
    }
  };

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditingData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      grade: user.grade || '',
      branch: user.branch || '',
      branchApproval: user.branchApproval,
    });
  };

  const saveEdit = async (id) => {
    setError(null);
    setInfo(null);
    try {
      const payload = { ...editingData };
      if (payload.role !== 'student') delete payload.grade;
      if (payload.role !== 'teacher') delete payload.branch;
      const resp = await adminService.updateUser(id, payload);
      setInfo(resp);
      setEditingId(null);
      setEditingData({});
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || t('admin.users.errUpdate'));
    }
  };

  const addToWatchlist = async (it) => {
    try {
      await adminService.addToWatchlist(it._id);
      setInfo({ message: t('admin.users.watchAdded', { name: it.name || it.email }) });
    } catch (e) {
      setError(e?.response?.data?.message || t('admin.users.errWatch'));
    }
  };

  const deleteUser = async (id) => {
    const confirmed = await askConfirm({
      title: t('admin.users.deleteTitle'),
      description: t('admin.users.deleteDesc'),
    });
    if (!confirmed) return;
    try {
      const r = await adminService.deleteUser(id);
      setInfo(r);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || t('admin.users.errDelete'));
    }
  };

  const renderUserActions = (it) => (
    <div className="flex flex-wrap gap-1.5">
      {it.status === 'pending' ? (
        <button type="button" className={a.btnSmSuccess} onClick={() => approve(it._id)}>
          {t('admin.users.approveBtn')}
        </button>
      ) : null}
      {editingId === it._id ? (
        <>
          <button type="button" className={a.btnSmSuccess} onClick={() => saveEdit(it._id)}>
            {t('admin.save')}
          </button>
          <button
            type="button"
            className={a.btnSmNeutral}
            onClick={() => {
              setEditingId(null);
              setEditingData({});
            }}
          >
            {t('admin.cancel')}
          </button>
        </>
      ) : (
        <button type="button" className={a.btnSmIndigo} onClick={() => startEdit(it)}>
          {t('admin.edit')}
        </button>
      )}
      <button type="button" className={a.btnSmOutline} onClick={() => setNotesUserId(it._id)}>
        {t('admin.users.notes')}
      </button>
      <button type="button" className={a.btnSmWarning} title={t('admin.users.watchTitle')} onClick={() => addToWatchlist(it)}>
        {t('admin.users.watch')}
      </button>
      {it.status !== 'disabled' ? (
        <button
          type="button"
          className={a.btnSmWarning}
          onClick={async () => {
            try {
              const r = await adminService.disableUser(it._id);
              setInfo(r);
              await load();
            } catch (e) {
              setError(e?.response?.data?.message || t('admin.users.errDisable'));
            }
          }}
        >
          {t('admin.users.suspend')}
        </button>
      ) : (
        <button
          type="button"
          className={a.btnSmIndigo}
          onClick={async () => {
            try {
              const r = await adminService.enableUser(it._id);
              setInfo(r);
              await load();
            } catch (e) {
              setError(e?.response?.data?.message || t('admin.users.errEnable'));
            }
          }}
        >
          {t('admin.users.enable')}
        </button>
      )}
      <button type="button" className={a.btnSmDanger} onClick={() => deleteUser(it._id)}>
        {t('admin.delete')}
      </button>
    </div>
  );

  return (
    <div className={a.pageWrap}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
            <UsersRound className="h-6 w-6" />
          </span>
          <div>
            <p className={a.eyebrow}>{t('admin.users.eyebrow')}</p>
            <h1 className={a.title}>{t('admin.users.title')}</h1>
            <p className={a.subtitle}>{t('admin.users.subtitle')}</p>
          </div>
        </div>
        <button type="button" className={`${a.btnPrimary} shrink-0`} onClick={() => setShowCreate((s) => !s)}>
          <UserPlus className="h-4 w-4" />
          {showCreate ? t('admin.users.closeForm') : t('admin.users.newUser')}
        </button>
      </header>

      {error && <div className={a.alertError}>{error}</div>}
      {info?.message && <div className={a.alertOk}>{info.message}</div>}

      {showCreate && (
        <form onSubmit={createUser} className={`${a.cardSoft} space-y-4`}>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            {t('admin.users.createTitle')}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className={a.fieldLabel}>{t('admin.users.name')}</label>
              <input
                className={a.input}
                value={createData.name}
                onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={a.fieldLabel}>{t('admin.users.email')}</label>
              <input
                className={a.input}
                type="email"
                value={createData.email}
                onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={a.fieldLabel}>{t('admin.users.password')}</label>
              <input
                className={a.input}
                type="password"
                value={createData.password}
                onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className={a.fieldLabel}>{t('admin.users.role')}</label>
              <select
                className={`${a.select} w-full`}
                value={createData.role}
                onChange={(e) => setCreateData({ ...createData, role: e.target.value })}
              >
                <option value="student">{roleLabel('student')}</option>
                <option value="teacher">{roleLabel('teacher')}</option>
                <option value="admin">{roleLabel('admin')}</option>
              </select>
            </div>
            {createData.role === 'student' && (
              <div>
                <label className={a.fieldLabel}>{t('admin.users.grade')}</label>
                <input
                  className={a.input}
                  placeholder={t('admin.users.gradePlaceholder')}
                  value={createData.grade}
                  onChange={(e) => setCreateData({ ...createData, grade: e.target.value })}
                />
              </div>
            )}
            {createData.role === 'teacher' && (
              <div>
                <label className={a.fieldLabel}>{t('admin.users.branch')}</label>
                <input
                  className={a.input}
                  placeholder={t('admin.users.branchPlaceholder')}
                  value={createData.branch}
                  onChange={(e) => setCreateData({ ...createData, branch: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className={a.fieldLabel}>{t('admin.users.status')}</label>
              <select
                className={`${a.select} w-full`}
                value={createData.status}
                onChange={(e) => setCreateData({ ...createData, status: e.target.value })}
              >
                <option value="pending">{statusLabel('pending')}</option>
                <option value="active">{statusLabel('active')}</option>
                <option value="disabled">{statusLabel('disabled')}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className={`${a.btnSmSuccess} px-5 py-2.5 text-sm`}>
              {t('admin.users.create')}
            </button>
          </div>
        </form>
      )}

      <div className={a.filterBar}>
        <div className="min-w-[180px] flex-1">
          <label className={a.fieldLabel}>{t('admin.users.search')}</label>
          <input
            className={a.input}
            placeholder={t('admin.users.searchPlaceholder')}
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
        </div>
        <div>
          <label className={a.fieldLabel}>{t('admin.users.status')}</label>
          <select
            className={a.select}
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="pending">{statusLabel('pending')}</option>
            <option value="all">{statusLabel('all')}</option>
            <option value="active">{statusLabel('active')}</option>
            <option value="disabled">{statusLabel('disabled')}</option>
          </select>
        </div>
        <div>
          <label className={a.fieldLabel}>{t('admin.users.role')}</label>
          <select
            className={a.select}
            value={role}
            onChange={(e) => {
              setPage(1);
              setRole(e.target.value);
            }}
          >
            <option value="all">{statusLabel('all')}</option>
            <option value="student">{roleLabel('student')}</option>
            <option value="teacher">{roleLabel('teacher')}</option>
            <option value="admin">{roleLabel('admin')}</option>
          </select>
        </div>
        <div>
          <label className={a.fieldLabel}>{t('admin.pageSize')}</label>
          <select
            className={a.select}
            value={limit}
            onChange={(e) => {
              setPage(1);
              setLimit(parseInt(e.target.value, 10));
            }}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {t('admin.perPage', { n })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className={a.loadingBox}>
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-teal-600" />
          {t('admin.users.loadingList')}
        </div>
      ) : items.length === 0 ? (
        <AdminTableEmpty title={t('admin.users.emptyTitle')} description={t('admin.users.emptyDesc')} />
      ) : (
        <>
          <div className={a.mobileCardList}>
            {items.map((it) => (
              <article key={it._id} className={a.mobileCard}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{it.name}</p>
                    <p className="text-sm text-slate-500 truncate">{it.email}</p>
                  </div>
                  <span className={a.badgeRole(it.role)}>{roleLabel(it.role)}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {t('admin.users.registered')}: {new Date(it.createdAt).toLocaleString(dateLocale)}
                </p>
                <input
                  className={`${a.inputCompact} w-full`}
                  value={tempPwByUser[it._id] || ''}
                  onChange={(e) => setTempPwByUser((prev) => ({ ...prev, [it._id]: e.target.value }))}
                  placeholder={t('admin.users.tempPassword')}
                />
                {renderUserActions(it)}
              </article>
            ))}
          </div>

          <div className={a.tableDesktopOnly}>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400 lg:hidden" role="note">
              {t('admin.tableScrollHint')}
            </p>
            <div className={a.tableWrap}>
              <table className={a.table}>
                <thead>
                  <tr>
                    <th className={a.thSticky}>{t('admin.users.name')}</th>
                    <th className={a.th}>{t('admin.users.email')}</th>
                    <th className={a.th}>{t('admin.users.role')}</th>
                    <th className={a.th}>{t('admin.users.registered')}</th>
                    <th className={a.th}>{t('admin.users.tempPassword')}</th>
                    <th className={a.th}>{t('admin.users.approve')}</th>
                    <th className={a.th}>{t('admin.edit')}</th>
                    <th className={a.th}>{t('admin.users.notes')}</th>
                    <th className={a.th}>{t('admin.users.account')}</th>
                    <th className={`${a.th} text-right`}>{t('admin.delete')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it._id} className={a.tr}>
                      <td className={a.tdSticky}>
                        {editingId === it._id ? (
                          <input
                            className={`${a.inputCompact} w-full max-w-[160px]`}
                            value={editingData.name || ''}
                            onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                          />
                        ) : (
                          <span className="font-semibold text-slate-900 dark:text-white">{it.name}</span>
                        )}
                      </td>
                      <td className={`${a.td} text-slate-600 dark:text-slate-300`}>
                        {editingId === it._id ? (
                          <input
                            className={`${a.inputCompact} w-full max-w-[200px]`}
                            value={editingData.email || ''}
                            onChange={(e) => setEditingData({ ...editingData, email: e.target.value })}
                          />
                        ) : (
                          it.email
                        )}
                      </td>
                      <td className={a.td}>
                        {editingId === it._id ? (
                          <select
                            className={`${a.select} w-full max-w-[120px] py-1 text-xs`}
                            value={editingData.role || 'student'}
                            onChange={(e) => setEditingData({ ...editingData, role: e.target.value })}
                          >
                            <option value="student">{roleLabel('student')}</option>
                            <option value="teacher">{roleLabel('teacher')}</option>
                            <option value="admin">{roleLabel('admin')}</option>
                          </select>
                        ) : (
                          <span className={a.badgeRole(it.role)}>{roleLabel(it.role)}</span>
                        )}
                      </td>
                      <td className={`${a.td} whitespace-nowrap text-xs text-slate-500`}>
                        {new Date(it.createdAt).toLocaleString(dateLocale)}
                      </td>
                      <td className={a.td}>
                        <input
                          className={`${a.inputCompact} w-full max-w-[120px]`}
                          value={tempPwByUser[it._id] || ''}
                          onChange={(e) => setTempPwByUser((prev) => ({ ...prev, [it._id]: e.target.value }))}
                          placeholder={t('admin.optional')}
                        />
                      </td>
                      <td className={a.td}>
                        {it.status === 'pending' ? (
                          <button type="button" className={a.btnSmSuccess} onClick={() => approve(it._id)}>
                            {t('admin.users.approveBtn')}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className={a.td}>
                        <div className="flex flex-wrap gap-1">
                          {editingId === it._id ? (
                            <>
                              <button type="button" className={a.btnSmSuccess} onClick={() => saveEdit(it._id)}>
                                {t('admin.save')}
                              </button>
                              <button
                                type="button"
                                className={a.btnSmNeutral}
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingData({});
                                }}
                              >
                                {t('admin.cancel')}
                              </button>
                            </>
                          ) : (
                            <button type="button" className={a.btnSmIndigo} onClick={() => startEdit(it)}>
                              {t('admin.edit')}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className={a.td}>
                        <div className="flex flex-wrap gap-1">
                          <button type="button" className={a.btnSmOutline} onClick={() => setNotesUserId(it._id)}>
                            {t('admin.users.notes')}
                          </button>
                          <button
                            type="button"
                            className={a.btnSmWarning}
                            title={t('admin.users.watchTitle')}
                            onClick={() => addToWatchlist(it)}
                          >
                            {t('admin.users.watch')}
                          </button>
                        </div>
                      </td>
                      <td className={a.td}>
                        {it.status !== 'disabled' ? (
                          <button
                            type="button"
                            className={a.btnSmWarning}
                            onClick={async () => {
                              try {
                                const r = await adminService.disableUser(it._id);
                                setInfo(r);
                                await load();
                              } catch (e) {
                                setError(e?.response?.data?.message || t('admin.users.errDisable'));
                              }
                            }}
                          >
                            {t('admin.users.suspend')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={a.btnSmIndigo}
                            onClick={async () => {
                              try {
                                const r = await adminService.enableUser(it._id);
                                setInfo(r);
                                await load();
                              } catch (e) {
                                setError(e?.response?.data?.message || t('admin.users.errEnable'));
                              }
                            }}
                          >
                            {t('admin.users.enable')}
                          </button>
                        )}
                      </td>
                      <td className={`${a.td} text-right`}>
                        <button type="button" className={a.btnSmDanger} onClick={() => deleteUser(it._id)}>
                          {t('admin.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900/50">
        <span className="font-medium text-slate-600 dark:text-slate-300">
          {t('admin.paginationTotal', { total: pagination.total })} ·{' '}
          {t('admin.paginationPage', { page: pagination.page })}
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
            disabled={page * pagination.limit >= pagination.total}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('admin.next')}
          </button>
        </div>
      </div>

      {notesUserId && (
        <div className={a.modalBackdrop}>
          <div className={a.modalPanel} role="dialog" aria-modal="true" aria-labelledby="notes-modal-title">
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-teal-600/12 to-teal-600/8 px-6 py-4 dark:border-slate-800">
              <h2 id="notes-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                {t('admin.users.notesModalTitle')}
              </h2>
              <button type="button" className={a.btnGhost} onClick={() => setNotesUserId(null)}>
                {t('admin.close')}
              </button>
            </div>
            <div className="px-6 py-5">
              <AdminInternalNotesPanel refType="user" refId={notesUserId} />
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
};

export default AdminUsers;
