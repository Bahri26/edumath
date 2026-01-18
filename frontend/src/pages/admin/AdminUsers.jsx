import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';

const AdminUsers = () => {
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
  const [branchItems, setBranchItems] = useState([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createData, setCreateData] = useState({ name: '', email: '', password: '', role: 'student', grade: '9. Sınıf', branch: '', status: 'pending' });
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});

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

  const loadBranch = async () => {
    setBranchLoading(true);
    try {
      const data = await adminService.listBranchRequests(q, 1, 50);
      setBranchItems(data.items || []);
    } catch (err) {
      // silent
    } finally { setBranchLoading(false); }
  };
  useEffect(() => { loadBranch(); }, [q]);

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

  const createUser = async (e) => {
    e.preventDefault();
    setError(null); setInfo(null);
    try {
      const payload = { ...createData };
      if (payload.role !== 'student') delete payload.grade;
      if (payload.role !== 'teacher') delete payload.branch;
      const resp = await adminService.createUser(payload);
      setInfo(resp);
      setShowCreate(false);
      setCreateData({ name: '', email: '', password: '', role: 'student', grade: '9. Sınıf', branch: '', status: 'pending' });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Kullanıcı oluşturma hatası');
    }
  };

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditingData({ name: user.name, email: user.email, role: user.role, status: user.status, grade: user.grade || '', branch: user.branch || '', branchApproval: user.branchApproval });
  };

  const saveEdit = async (id) => {
    setError(null); setInfo(null);
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Kullanıcı Onayları</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {info && <div className="mb-4 p-4 border rounded bg-green-50">{info.message}</div>}
      <div className="mb-4">
        <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={()=>setShowCreate(s=>!s)}>
          {showCreate ? 'Formu Kapat' : 'Yeni Kullanıcı Oluştur'}
        </button>
      </div>
      {showCreate && (
        <form onSubmit={createUser} className="mb-6 p-4 border rounded space-y-3 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Ad Soyad" value={createData.name} onChange={e=>setCreateData({...createData, name: e.target.value})} required />
            <input className="border rounded px-3 py-2" placeholder="E-posta" type="email" value={createData.email} onChange={e=>setCreateData({...createData, email: e.target.value})} required />
            <input className="border rounded px-3 py-2" placeholder="Şifre" type="password" value={createData.password} onChange={e=>setCreateData({...createData, password: e.target.value})} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select className="border rounded px-3 py-2" value={createData.role} onChange={e=>setCreateData({...createData, role: e.target.value})}>
              <option value="student">Öğrenci</option>
              <option value="teacher">Öğretmen</option>
              <option value="admin">Admin</option>
            </select>
            {createData.role === 'student' && (
              <input className="border rounded px-3 py-2" placeholder="Sınıf (örn. 9. Sınıf)" value={createData.grade} onChange={e=>setCreateData({...createData, grade: e.target.value})} />
            )}
            {createData.role === 'teacher' && (
              <input className="border rounded px-3 py-2" placeholder="Branş (örn. Matematik)" value={createData.branch} onChange={e=>setCreateData({...createData, branch: e.target.value})} />
            )}
            <select className="border rounded px-3 py-2" value={createData.status} onChange={e=>setCreateData({...createData, status: e.target.value})}>
              <option value="pending">Bekleyen</option>
              <option value="active">Aktif</option>
              <option value="disabled">Kapalı</option>
            </select>
          </div>
          <div>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Oluştur</button>
          </div>
        </form>
      )}
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
              <th className="p-2 border">Onay</th>
              <th className="p-2 border">Düzenle</th>
              <th className="p-2 border">Durum</th>
              <th className="p-2 border">Sil</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it._id}>
                <td className="p-2 border">{editingId===it._id ? (<input className="border rounded px-2 py-1 w-full" value={editingData.name||''} onChange={e=>setEditingData({...editingData, name:e.target.value})} />) : it.name}</td>
                <td className="p-2 border">{editingId===it._id ? (<input className="border rounded px-2 py-1 w-full" value={editingData.email||''} onChange={e=>setEditingData({...editingData, email:e.target.value})} />) : it.email}</td>
                <td className="p-2 border">{editingId===it._id ? (
                  <select className="border rounded px-2 py-1" value={editingData.role||'student'} onChange={e=>setEditingData({...editingData, role:e.target.value})}>
                    <option value="student">Öğrenci</option>
                    <option value="teacher">Öğretmen</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : it.role}</td>
                <td className="p-2 border">{new Date(it.createdAt).toLocaleString()}</td>
                <td className="p-2 border">
                  <input className="border p-1 rounded" value={tempPwByUser[it._id] || ''} onChange={e=>setTempPwByUser(prev=>({ ...prev, [it._id]: e.target.value }))} placeholder="Opsiyonel" />
                </td>
                <td className="p-2 border">
                  {it.status === 'pending' ? (
                    <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => approve(it._id)}>Onayla</button>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="p-2 border space-x-2">
                  {editingId===it._id ? (
                    <>
                      <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={()=>saveEdit(it._id)}>Kaydet</button>
                      <button className="px-3 py-1 bg-slate-500 text-white rounded" onClick={()=>{ setEditingId(null); setEditingData({}); }}>İptal</button>
                    </>
                  ) : (
                    <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={()=>startEdit(it)}>Düzenle</button>
                  )}
                </td>
                <td className="p-2 border space-x-2">
                  {it.status !== 'disabled' ? (
                    <button className="px-3 py-1 bg-yellow-600 text-white rounded" onClick={async()=>{ try{ const r=await adminService.disableUser(it._id); setInfo(r); await load(); }catch(e){ setError(e?.response?.data?.message||'Devre dışı bırakma hatası'); } }}>Devre Dışı</button>
                  ) : (
                    <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={async()=>{ try{ const r=await adminService.enableUser(it._id); setInfo(r); await load(); }catch(e){ setError(e?.response?.data?.message||'Aktif etme hatası'); } }}>Aktif Et</button>
                  )}
                </td>
                <td className="p-2 border">
                  <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={async()=>{ if(!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return; try{ const r=await adminService.deleteUser(it._id); setInfo(r); await load(); }catch(e){ setError(e?.response?.data?.message||'Silme hatası'); } }}>Sil</button>
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

        {/* Branş Onay Talepleri */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-3">Branş Onay Talepleri</h2>
          {branchLoading ? 'Yükleniyor...' : (
            <table className="w-full border">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 border">Ad</th>
                  <th className="p-2 border">E-posta</th>
                  <th className="p-2 border">Branş</th>
                  <th className="p-2 border">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {branchItems.map(it => (
                  <tr key={it._id}>
                    <td className="p-2 border">{it.name}</td>
                    <td className="p-2 border">{it.email}</td>
                    <td className="p-2 border">{it.branch}</td>
                    <td className="p-2 border space-x-2">
                      <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={async()=>{ try{ const r=await adminService.approveBranch(it._id); setInfo(r); await loadBranch(); }catch(e){ setError(e?.response?.data?.message||'Onay hatası'); } }}>Onayla</button>
                      <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={async()=>{ try{ const r=await adminService.denyBranch(it._id); setInfo(r); await loadBranch(); }catch(e){ setError(e?.response?.data?.message||'Reddetme hatası'); } }}>Reddet</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
          <label className="text-sm mr-2">Durum:</label>
          <select className="border rounded px-2 py-1" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="pending">Bekleyen</option>
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
