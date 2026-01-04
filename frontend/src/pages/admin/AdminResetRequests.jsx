import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';

const AdminResetRequests = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [approvedInfo, setApprovedInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await adminService.listResetRequests(status);
      setItems(search ? data.filter(d=> (d.email||'').toLowerCase().includes(search.toLowerCase())) : data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Listeleme hatası');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status, search]);

  useEffect(() => {
    if (approvedInfo?.expiresAt) {
      const tick = () => {
        const diff = new Date(approvedInfo.expiresAt).getTime() - Date.now();
        setTimeLeft(diff > 0 ? Math.ceil(diff / 1000) : 0);
      };
      tick();
      const iv = setInterval(tick, 1000);
      return () => clearInterval(iv);
    } else {
      setTimeLeft(null);
    }
  }, [approvedInfo]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [mustChange, setMustChange] = useState(false);

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
    try { await navigator.clipboard.writeText(approvedInfo.rawToken); } catch {}
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Şifre Sıfırlama Talepleri</h1>
      <div className="flex items-center gap-3 mb-3">
        <div>
          <label className="text-sm mr-2">Durum:</label>
          <select className="border rounded px-2 py-1" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="pending">Bekleyen</option>
            <option value="approved">Onaylı</option>
            <option value="denied">Reddedilen</option>
          </select>
        </div>
        <input className="border rounded px-3 py-2" placeholder="E-posta ara" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {approvedInfo && (
        <div className="mb-4 p-4 border rounded bg-green-50">
          <div>Talep onaylandı.</div>
          {approvedInfo.rawToken ? (
            <>
              <div className="mt-2 flex items-center space-x-2">
                <span><b>Token:</b> {approvedInfo.rawToken}</span>
                <button className="px-2 py-1 border rounded" onClick={copyToken}>Kopyala</button>
              </div>
              {approvedInfo.expiresAt && (
                <div><b>Son Kullanma:</b> {new Date(approvedInfo.expiresAt).toLocaleString()} {typeof timeLeft === 'number' && <span className="text-sm text-slate-500">(≈ {timeLeft}s)</span>}</div>
              <input
              <div className="text-sm text-slate-500 mt-2">Bu token'ı kullanıcı ile paylaşın. Kullanıcı /reset-password sayfasında e-posta ve token ile şifreyi güncelleyebilir.</div>
            </>
          ) : (
            <div className="text-sm text-slate-700 mt-2">Yeni şifre başarıyla atandı. Kullanıcı doğrudan bu şifreyle giriş yapabilir.</div>
          )}
        </div>
              <div className="text-xs text-slate-500 mb-4">En az 8 karakter, büyük/küçük harf, rakam ve sembol içermelidir.</div>
              <label className="flex items-center gap-2 text-sm mb-4">
                <input type="checkbox" checked={mustChange} onChange={e=>setMustChange(e.target.checked)} />
                İlk girişte şifre değiştirilsin
              </label>
      )}
      {loading ? 'Yükleniyor...' : (
                <button className="px-3 py-2 rounded bg-green-600 text-white" type="button" onClick={submitApproveWithPassword} disabled={actionLoading || !newPassword}>
          <thead>
            <tr className="bg-slate-100">
              <th className="p-2 border">E-posta</th>
              <th className="p-2 border">Not</th>
              <th className="p-2 border">Oluşturulma</th>
              <th className="p-2 border">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it._id}>
                <td className="p-2 border">{it.email}</td>
                <td className="p-2 border">{it.note || '-'}</td>
                <td className="p-2 border">{new Date(it.createdAt).toLocaleString()}</td>
                <td className="p-2 border space-x-2">
                  <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => openApproveWithPassword(it._id)} disabled={actionLoading}>Onayla</button>
                  <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={() => approveTokenFlow(it._id)} disabled={actionLoading}>Token Üret</button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => deny(it._id)} disabled={actionLoading}>Reddet</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded p-6 w-full max-w-md shadow">
            <h2 className="text-xl font-semibold mb-3">Yeni Şifre Ata</h2>
            <p className="text-sm text-slate-600 mb-4">Bu talep için doğrudan yeni bir şifre belirleyin. Kullanıcı bu şifreyle giriş yapabilir.</p>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 mb-4"
              placeholder="Yeni şifre (min 6 karakter)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button className="px-3 py-2 rounded border" type="button" onClick={() => { setShowPasswordModal(false); setCurrentRequestId(null); }}>İptal</button>
              <button className="px-3 py-2 rounded bg-green-600 text-white" type="button" onClick={submitApproveWithPassword} disabled={actionLoading || !newPassword || newPassword.length < 6}>
                {actionLoading ? 'İşleniyor...' : 'Onayla ve Şifre Ata'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResetRequests;
