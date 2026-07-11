import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import adminService from '../../services/adminService';
import AdminInternalNotesPanel from '../../components/admin/AdminInternalNotesPanel';
import AdminScrollHint from '../../components/admin/AdminScrollHint';
import { admin as a } from '../../components/admin/adminUi';

const AdminResetRequests = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approvedInfo, setApprovedInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [mustChange, setMustChange] = useState(false);
  const [notesRequestId, setNotesRequestId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listResetRequests(status);
      setItems(
        search ? data.filter((d) => (d.email || '').toLowerCase().includes(search.toLowerCase())) : data
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Listeleme hatası');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (approvedInfo?.expiresAt) {
      const tick = () => {
        const diff = new Date(approvedInfo.expiresAt).getTime() - Date.now();
        setTimeLeft(diff > 0 ? Math.ceil(diff / 1000) : 0);
      };
      tick();
      const iv = setInterval(tick, 1000);
      return () => clearInterval(iv);
    }
    setTimeLeft(null);
    return undefined;
  }, [approvedInfo]);

  const openApproveWithPassword = (id) => {
    setCurrentRequestId(id);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const submitApproveWithPassword = async () => {
    if (!currentRequestId) return;
    setApprovedInfo(null);
    setError(null);
    setActionLoading(true);
    try {
      const resp = await adminService.approveResetRequestWithPassword(currentRequestId, newPassword, mustChange);
      setApprovedInfo(resp);
      setShowPasswordModal(false);
      setCurrentRequestId(null);
      setNewPassword('');
      setMustChange(false);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Onay/şifre atama hatası');
    } finally {
      setActionLoading(false);
    }
  };

  const approveTokenFlow = async (id) => {
    setApprovedInfo(null);
    setError(null);
    setActionLoading(true);
    try {
      const data = await adminService.approveResetRequest(id);
      setApprovedInfo(data);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Token üretme/onay hatası');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToken = async () => {
    if (!approvedInfo?.rawToken) return;
    try {
      await navigator.clipboard.writeText(approvedInfo.rawToken);
    } catch {
      /* ignore */
    }
  };

  const deny = async (id) => {
    try {
      await adminService.denyResetRequest(id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Reddetme hatası');
    }
  };

  return (
    <div className={a.pageWrap}>
      <header className="flex flex-wrap items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
          <KeyRound className="h-6 w-6" />
        </span>
        <div>
          <p className={a.eyebrow}>Güvenlik</p>
          <h1 className={a.title}>Şifre sıfırlama talepleri</h1>
          <p className={a.subtitle}>
            Talepleri inceleyin; doğrudan şifre atayın veya zaman sınırlı token üretin. İç notlarla ekip içi
            iletişimi sürdürün.
          </p>
        </div>
      </header>

      <div className={a.filterBar}>
        <div>
          <label className={a.fieldLabel}>Durum</label>
          <select className={a.select} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Bekleyen</option>
            <option value="approved">Onaylı</option>
            <option value="denied">Reddedilen</option>
          </select>
        </div>
        <div className="min-w-[200px] flex-1">
          <label className={a.fieldLabel}>E-posta ara</label>
          <input
            className={a.input}
            placeholder="örnek@…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className={a.alertError}>{error}</div>}

      {approvedInfo && (
        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-md dark:border-emerald-900/40 dark:from-emerald-950/40 dark:to-slate-900">
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">İşlem tamamlandı</p>
          {approvedInfo.rawToken ? (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <code className="max-w-full flex-1 overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-emerald-300">
                  {approvedInfo.rawToken}
                </code>
                <button type="button" className={a.btnSecondary} onClick={copyToken}>
                  Kopyala
                </button>
              </div>
              {approvedInfo.expiresAt && (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Son kullanma: {new Date(approvedInfo.expiresAt).toLocaleString()}
                  {typeof timeLeft === 'number' && <span className="ml-2 tabular-nums">({timeLeft}s)</span>}
                </p>
              )}
              <p className="text-xs text-slate-500">
                Kullanıcıyı <span className="font-medium text-slate-700 dark:text-slate-300">/reset-password</span>{' '}
                sayfasına yönlendirin.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
              Yeni şifre atandı; kullanıcı bu şifreyle giriş yapabilir.
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className={a.loadingBox}>
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-teal-600" />
          Talepler yükleniyor…
        </div>
      ) : (
        <>
        <AdminScrollHint />
        <div className={a.tableWrap}>
          <table className={a.table}>
            <thead>
              <tr>
                <th className={a.th}>E-posta</th>
                <th className={a.th}>Kullanıcı notu</th>
                <th className={a.th}>Tarih</th>
                <th className={`${a.th} text-right`}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it._id} className={a.tr}>
                  <td className={`${a.td} font-medium text-slate-900 dark:text-white`}>{it.email}</td>
                  <td className={`${a.td} max-w-[200px] truncate text-slate-500`}>{it.note || '—'}</td>
                  <td className={`${a.td} whitespace-nowrap text-xs text-slate-500`}>
                    {new Date(it.createdAt).toLocaleString()}
                  </td>
                  <td className={`${a.td} text-right`}>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        className={a.btnSmSuccess}
                        onClick={() => openApproveWithPassword(it._id)}
                        disabled={actionLoading}
                      >
                        Şifre ata
                      </button>
                      <button
                        type="button"
                        className={a.btnSmIndigo}
                        onClick={() => approveTokenFlow(it._id)}
                        disabled={actionLoading}
                      >
                        Token
                      </button>
                      <button
                        type="button"
                        className={a.btnSmDanger}
                        onClick={() => deny(it._id)}
                        disabled={actionLoading}
                      >
                        Reddet
                      </button>
                      <button type="button" className={a.btnSmOutline} onClick={() => setNotesRequestId(it._id)}>
                        İç notlar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className={`${a.td} py-12 text-center text-slate-500`} colSpan={4}>
                    Bu filtrede talep yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </>
      )}

      {notesRequestId && (
        <div className={a.modalBackdrop}>
          <div className={a.modalPanel} role="dialog" aria-modal="true" aria-labelledby="reset-notes-title">
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-amber-500/12 to-orange-600/8 px-6 py-4 dark:border-slate-800">
              <h2 id="reset-notes-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Talep iç notları
              </h2>
              <button type="button" className={a.btnGhost} onClick={() => setNotesRequestId(null)}>
                Kapat
              </button>
            </div>
            <div className="px-6 py-5">
              <AdminInternalNotesPanel refType="password_reset_request" refId={notesRequestId} />
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className={a.modalBackdrop}>
          <div className={`${a.modalPanel} max-w-md`} role="dialog" aria-modal="true">
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Yeni şifre ata</h2>
              <p className="mt-1 text-sm text-slate-500">
                Güçlü şifre politikası geçerlidir (büyük/küçük harf, rakam, sembol, min. 8).
              </p>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className={a.fieldLabel}>Yeni şifre</label>
                <input
                  type="password"
                  className={a.input}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  checked={mustChange}
                  onChange={(e) => setMustChange(e.target.checked)}
                />
                İlk girişte şifre değiştirilsin
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className={a.btnSecondary}
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentRequestId(null);
                  }}
                >
                  İptal
                </button>
                <button
                  type="button"
                  className={a.btnPrimary}
                  onClick={submitApproveWithPassword}
                  disabled={actionLoading || !newPassword || newPassword.length < 6}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      İşleniyor…
                    </>
                  ) : (
                    'Onayla ve ata'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResetRequests;
