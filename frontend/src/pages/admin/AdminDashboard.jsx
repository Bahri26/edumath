import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';

const StatCard = ({ label, value, onClick, color = 'bg-indigo-600' }) => (
  <div className="p-4 border rounded shadow-sm bg-white">
    <div className="text-sm text-slate-600">{label}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
    {onClick && (
      <button className={`mt-3 px-3 py-1 rounded text-white ${color}`} onClick={onClick}>İşlemler</button>
    )}
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const data = await adminService.getAdminStats();
        setStats(data);
      } catch (err) {
        // Fallback: stats endpoint yoksa listelerden üret
        const status = err?.response?.status;
        if (status === 404) {
          try {
            const [pendingResets, pendingUsers] = await Promise.all([
              adminService.listResetRequests('pending'),
              adminService.listUsers('pending', 'all')
            ]);
            setStats({
              metrics: {
                pendingResetCount: pendingResets.length,
                pendingUserCount: pendingUsers.length,
              },
              recent: {
                resetRequests: pendingResets.slice(0, 5),
                pendingUsers: pendingUsers.slice(0, 5)
              }
            });
          } catch (e2) {
            setError(e2?.response?.data?.message || 'İstatistikler yüklenemedi');
          }
        } else {
          setError(err?.response?.data?.message || 'İstatistikler yüklenemedi');
        }
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const m = stats?.metrics || {};
  const recent = stats?.recent || {};

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Paneli</h2>
      <p className="text-slate-600">İşlemleri hızlandırmak için önemli veriler aşağıda özetlenmiştir.</p>
      {error && <div className="text-red-600">{error}</div>}
      {loading ? 'Yükleniyor...' : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Bekleyen Sıfırlama Talepleri" value={m.pendingResetCount ?? '-'} onClick={() => navigate('/admin/reset-requests')} />
            <StatCard label="Bekleyen Kullanıcı Onayları" value={m.pendingUserCount ?? '-'} onClick={() => navigate('/admin/users')} color="bg-emerald-600" />
            <StatCard label="Okunmamış Bildirimler" value={m.unreadNotifications ?? '-'} onClick={() => navigate('/admin/settings')} color="bg-slate-700" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Öğrenci Sayısı" value={m.studentsCount ?? '-'} />
            <StatCard label="Öğretmen Sayısı" value={m.teachersCount ?? '-'} />
            <StatCard label="Admin Sayısı" value={m.adminsCount ?? '-'} />
            <StatCard label="Aktif/Kapalı" value={`${m.activeUsersCount ?? '-'} / ${m.disabledUsersCount ?? '-'}`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded p-4 bg-white">
              <div className="font-semibold mb-2">Son Bekleyen Sıfırlama Talepleri</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-1">E-posta</th>
                    <th className="py-1">Not</th>
                    <th className="py-1">Oluşturulma</th>
                  </tr>
                </thead>
                <tbody>
                  {(recent.resetRequests || []).map(r => (
                    <tr key={r._id} className="border-t">
                      <td className="py-1">{r.email}</td>
                      <td className="py-1">{r.note || '-'}</td>
                      <td className="py-1">{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {(!recent.resetRequests || recent.resetRequests.length === 0) && (
                    <tr><td className="py-2 text-slate-500" colSpan={3}>Kayıt yok</td></tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-end mt-2">
                <button className="px-3 py-1 rounded border" onClick={() => navigate('/admin/reset-requests')}>Taleplere Git</button>
              </div>
            </div>
            <div className="border rounded p-4 bg-white">
              <div className="font-semibold mb-2">Son Bekleyen Kullanıcılar</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-1">Ad</th>
                    <th className="py-1">E-posta</th>
                    <th className="py-1">Rol</th>
                    <th className="py-1">Oluşturulma</th>
                  </tr>
                </thead>
                <tbody>
                  {(recent.pendingUsers || []).map(u => (
                    <tr key={u._id} className="border-t">
                      <td className="py-1">{u.name}</td>
                      <td className="py-1">{u.email}</td>
                      <td className="py-1">{u.role}</td>
                      <td className="py-1">{new Date(u.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {(!recent.pendingUsers || recent.pendingUsers.length === 0) && (
                    <tr><td className="py-2 text-slate-500" colSpan={4}>Kayıt yok</td></tr>
                  )}
                </tbody>
              </table>
              <div className="flex justify-end mt-2">
                <button className="px-3 py-1 rounded border" onClick={() => navigate('/admin/users')}>Onaylara Git</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
