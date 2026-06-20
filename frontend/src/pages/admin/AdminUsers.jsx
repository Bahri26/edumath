import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, UserPlus, UsersRound } from 'lucide-react';
import adminService from '../../services/adminService';
import AdminInternalNotesPanel from '../../components/admin/AdminInternalNotesPanel';
import { admin as a } from '../../components/admin/adminUi';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import { useTranslation } from '../../i18n/useTranslation';

const AdminUsers = () => {
  const { t } = useTranslation();
  const { askConfirm, ConfirmDialog } = useConfirmAction();
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listUsers(status, role, q, page, limit);
      setItems(data.items);
      setPagination(data.pagination || { page, limit, total: data.items?.length || 0 });
    } catch (err) {
      setError(err?.response?.data?.message || 'Listeleme hatası');
    } finally {
      setLoading(false);
    }
  }, [status, role, q, page, limit]);

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
      setError(err?.response?.data?.message || 'Onay hatası');
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
      setError(err?.response?.data?.message || 'Kullanıcı oluşturma hatası');
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
      setError(err?.response?.data?.message || 'Güncelleme hatası');
    }
  };

  return (
    <div className={a.pageWrap}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
            <UsersRound className="h-6 w-6" />
          </span>
          <div>
            <p className={a.eyebrow}>Erişim</p>
            <h1 className={a.title}>Kullanıcı onayları</h1>
            <p className={a.subtitle}>Kayıtları filtreleyin, onaylayın veya iç notlarla vaka takibi yapın.</p>
          </div>
        </div>
        <button
          type="button"
          className={`${a.btnPrimary} shrink-0`}
          onClick={() => setShowCreate((s) => !s)}
        >
          <UserPlus className="h-4 w-4" />
          {showCreate ? 'Formu kapat' : 'Yeni kullanıcı'}
        </button>
      </header>

      {error && <div className={a.alertError}>{error}</div>}
      {info?.message && <div className={a.alertOk}>{info.message}</div>}

      {showCreate && (
        <form onSubmit={createUser} className={`${a.cardSoft} space-y-4`}>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Yeni kullanıcı</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className={a.fieldLabel}>Ad soyad</label>
              <input
                className={a.input}
                placeholder="Ad Soyad"
                value={createData.name}
                onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={a.fieldLabel}>E-posta</label>
              <input
                className={a.input}
                placeholder="E-posta"
                type="email"
                value={createData.email}
                onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={a.fieldLabel}>Şifre</label>
              <input
                className={a.input}
                placeholder="Şifre"
                type="password"
                value={createData.password}
                onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className={a.fieldLabel}>Rol</label>
              <select
                className={a.select + ' w-full'}
                value={createData.role}
                onChange={(e) => setCreateData({ ...createData, role: e.target.value })}
              >
                <option value="student">Öğrenci</option>
                <option value="teacher">Öğretmen</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {createData.role === 'student' && (
              <div>
                <label className={a.fieldLabel}>Sınıf</label>
                <input
                  className={a.input}
                  placeholder="örn. 9. Sınıf"
                  value={createData.grade}
                  onChange={(e) => setCreateData({ ...createData, grade: e.target.value })}
                />
              </div>
            )}
            {createData.role === 'teacher' && (
              <div>
                <label className={a.fieldLabel}>Branş</label>
                <input
                  className={a.input}
                  placeholder="örn. Matematik"
                  value={createData.branch}
                  onChange={(e) => setCreateData({ ...createData, branch: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className={a.fieldLabel}>Durum</label>
              <select
                className={a.select + ' w-full'}
                value={createData.status}
                onChange={(e) => setCreateData({ ...createData, status: e.target.value })}
              >
                <option value="pending">Bekleyen</option>
                <option value="active">Aktif</option>
                <option value="disabled">Kapalı</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className={a.btnSmSuccess + ' px-5 py-2.5 text-sm'}>
              Oluştur
            </button>
          </div>
        </form>
      )}

      <div className={a.filterBar}>
        <div className="min-w-[180px] flex-1">
          <label className={a.fieldLabel}>Ara</label>
          <input
            className={a.input}
            placeholder="Ad veya e-posta"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
        </div>
        <div>
          <label className={a.fieldLabel}>Durum</label>
          <select
            className={a.select}
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
          >
            <option value="pending">Bekleyen</option>
            <option value="all">Tümü</option>
            <option value="active">Aktif</option>
            <option value="disabled">Kapalı</option>
          </select>
        </div>
        <div>
          <label className={a.fieldLabel}>Rol</label>
          <select
            className={a.select}
            value={role}
            onChange={(e) => {
              setPage(1);
              setRole(e.target.value);
            }}
          >
            <option value="all">Tümü</option>
            <option value="student">Öğrenci</option>
            <option value="teacher">Öğretmen</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className={a.fieldLabel}>Sayfa</label>
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
                {n} / sayfa
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className={a.loadingBox}>
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-violet-600" />
          Liste yükleniyor…
        </div>
      ) : (
        <>
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400 md:hidden" role="note">
          {t('admin.tableScrollHint')}
        </p>
        <div className={a.tableWrap}>
          <table className={a.table}>
            <thead>
              <tr>
                <th className={a.thSticky}>Ad</th>
                <th className={a.th}>E-posta</th>
                <th className={a.th}>Rol</th>
                <th className={a.th}>Kayıt</th>
                <th className={a.th}>Geçici şifre</th>
                <th className={a.th}>Onay</th>
                <th className={a.th}>Düzenle</th>
                <th className={a.th}>Notlar</th>
                <th className={a.th}>Hesap</th>
                <th className={`${a.th} text-right`}>Sil</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it._id} className={a.tr}>
                  <td className={a.tdSticky}>
                    {editingId === it._id ? (
                      <input
                        className={a.inputCompact + ' w-full max-w-[160px]'}
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
                        className={a.inputCompact + ' w-full max-w-[200px]'}
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
                        className={a.select + ' w-full max-w-[120px] py-1 text-xs'}
                        value={editingData.role || 'student'}
                        onChange={(e) => setEditingData({ ...editingData, role: e.target.value })}
                      >
                        <option value="student">Öğrenci</option>
                        <option value="teacher">Öğretmen</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={a.badgeRole(it.role)}>{it.role}</span>
                    )}
                  </td>
                  <td className={`${a.td} whitespace-nowrap text-xs text-slate-500`}>
                    {new Date(it.createdAt).toLocaleString()}
                  </td>
                  <td className={a.td}>
                    <input
                      className={a.inputCompact + ' w-full max-w-[120px]'}
                      value={tempPwByUser[it._id] || ''}
                      onChange={(e) => setTempPwByUser((prev) => ({ ...prev, [it._id]: e.target.value }))}
                      placeholder="Opsiyonel"
                    />
                  </td>
                  <td className={a.td}>
                    {it.status === 'pending' ? (
                      <button type="button" className={a.btnSmSuccess} onClick={() => approve(it._id)}>
                        Onayla
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
                            Kaydet
                          </button>
                          <button
                            type="button"
                            className={a.btnSmNeutral}
                            onClick={() => {
                              setEditingId(null);
                              setEditingData({});
                            }}
                          >
                            İptal
                          </button>
                        </>
                      ) : (
                        <button type="button" className={a.btnSmIndigo} onClick={() => startEdit(it)}>
                          Düzenle
                        </button>
                      )}
                    </div>
                  </td>
                  <td className={a.td}>
                    <div className="flex flex-wrap gap-1">
                      <button type="button" className={a.btnSmOutline} onClick={() => setNotesUserId(it._id)}>
                        Notlar
                      </button>
                      <button
                        type="button"
                        className={a.btnSmWarning}
                        title="Aktivite takip listesine ekle"
                        onClick={async () => {
                          try {
                            await adminService.addToWatchlist(it._id);
                            setInfo({ message: `${it.name || it.email} takip listesine eklendi.` });
                          } catch (e) {
                            setError(e?.response?.data?.message || 'Takibe eklenemedi');
                          }
                        }}
                      >
                        Takip
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
                            setError(e?.response?.data?.message || 'Devre dışı bırakma hatası');
                          }
                        }}
                      >
                        Askıya al
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
                            setError(e?.response?.data?.message || 'Aktif etme hatası');
                          }
                        }}
                      >
                        Aktif et
                      </button>
                    )}
                  </td>
                  <td className={`${a.td} text-right`}>
                    <button
                      type="button"
                      className={a.btnSmDanger}
                      onClick={async () => {
                        const confirmed = await askConfirm({
                          title: 'Kullanıcı silinsin mi?',
                          description:
                            'Bu kullanıcı hesabı kalıcı olarak kaldırılacak. İlişkili veriler silinir ve geri alınamaz.',
                        });
                        if (!confirmed) return;
                        try {
                          const r = await adminService.deleteUser(it._id);
                          setInfo(r);
                          await load();
                        } catch (e) {
                          setError(e?.response?.data?.message || 'Silme hatası');
                        }
                      }}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
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
            disabled={page * pagination.limit >= pagination.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Sonraki
          </button>
        </div>
      </div>

      {notesUserId && (
        <div className={a.modalBackdrop}>
          <div className={a.modalPanel} role="dialog" aria-modal="true" aria-labelledby="notes-modal-title">
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-violet-600/12 to-indigo-600/8 px-6 py-4 dark:border-slate-800">
              <h2 id="notes-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Kullanıcı iç notları
              </h2>
              <button type="button" className={a.btnGhost} onClick={() => setNotesUserId(null)}>
                Kapat
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
