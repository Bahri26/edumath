import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';

const AdminUsers = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tempPwByUser, setTempPwByUser] = useState({});
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [info, setInfo] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await adminService.listUsers(status, role, q, page, limit);
      setItems(data.items);
      setPagination(data.pagination || { page, limit, total: data.items?.length || 0 });
    } catch (err) {
      setError(err?.response?.data?.message || 'Listeleme hatası');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status, role, q, page, limit]);

  const approve = async (id) => {
    setInfo(null);
    try {
      const tempPw = tempPwByUser[id] || undefined;
      const data = await adminService.approveUser(id, tempPw);
      setInfo(data);
      setTempPwByUser(prev => ({ ...prev, [id]: '' }));
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Onay hatası');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Kullanıcı Onayları</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {info && <div className="mb-4 p-4 border rounded bg-green-50">{info.message}</div>}
      <div className="flex items-center gap-3 mb-3">
        <input className="border rounded px-3 py-2" placeholder="Ad/E-posta ara" value={q} onChange={e=>{ setPage(1); setQ(e.target.value); }} />
        <div>
          <label className="text-sm mr-2">Sayfa Boyutu:</label>
          <select className="border rounded px-2 py-1" value={limit} onChange={e=>{ setPage(1); setLimit(parseInt(e.target.value)); }}>
            {[10,20,50].map(n=> <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      {loading ? 'Yükleniyor...' : (
        <table className="w-full border">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-2 border">Ad</th>
              <th className="p-2 border">E-posta</th>
              <th className="p-2 border">Rol</th>
              <th className="p-2 border">Oluşturulma</th>
              <th className="p-2 border">Geçici Şifre</th>
              <th className="p-2 border">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it._id}>
                <td className="p-2 border">{it.name}</td>
                <td className="p-2 border">{it.email}</td>
                <td className="p-2 border">{it.role}</td>
                <td className="p-2 border">{new Date(it.createdAt).toLocaleString()}</td>
                <td className="p-2 border">
                  <input className="border p-1 rounded" value={tempPwByUser[it._id] || ''} onChange={e=>setTempPwByUser(prev=>({ ...prev, [it._id]: e.target.value }))} placeholder="Opsiyonel" />
                </td>
                <td className="p-2 border">
                  <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => approve(it._id)}>Onayla</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-slate-600">Toplam: {pagination.total} | Sayfa: {pagination.page}</div>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded border" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Önceki</button>
          <button className="px-3 py-1 rounded border" disabled={(pagination.page*pagination.limit)>=pagination.total} onClick={()=>setPage(p=>p+1)}>Sonraki</button>
        </div>
      </div>

      <div className="mt-4 flex items-center space-x-3">
        <div>
          <label className="text-sm mr-2">Durum:</label>
          <select className="border rounded px-2 py-1" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="all">Tümü</option>
            <option value="pending">Bekleyen</option>
            <option value="active">Aktif</option>
            <option value="disabled">Kapalı</option>
          </select>
        </div>
        <div>
          <label className="text-sm mr-2">Rol:</label>
          <select className="border rounded px-2 py-1" value={role} onChange={e=>setRole(e.target.value)}>
            <option value="all">Tümü</option>
            <option value="student">Öğrenci</option>
            <option value="teacher">Öğretmen</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
