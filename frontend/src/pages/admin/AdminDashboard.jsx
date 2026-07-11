import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import adminService from '../../services/adminService';
import { admin as a } from '../../components/admin/adminUi';

const StatCard = ({ label, value, onClick, accent = 'teal' }) => {
  const bars = {
    teal: 'from-teal-500 via-sky-500 to-sky-600',
    emerald: 'from-emerald-400 via-teal-500 to-teal-600',
    slate: 'from-slate-500 via-slate-600 to-slate-800',
  };
  const shell = [
    'group relative w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-md shadow-slate-200/20 transition-all dark:border-slate-700 dark:bg-slate-900/75 dark:shadow-none',
    onClick
      ? 'cursor-pointer hover:-translate-y-0.5 hover:border-teal-300/60 hover:shadow-xl hover:shadow-teal-500/10 dark:hover:border-teal-500/25'
      : '',
  ].join(' ');
  const inner = (
    <>
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${bars[accent] || bars.teal}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
          <div className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{value}</div>
        </div>
        {onClick && (
          <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-teal-100 group-hover:text-teal-700 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-teal-950 dark:group-hover:text-teal-300">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={shell} onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <div className={shell}>{inner}</div>;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminService.getAdminStats();
        setStats(data);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          try {
            const [pendingResets, pendingUsers] = await Promise.all([
              adminService.listResetRequests('pending'),
              adminService.listUsers('pending', 'all'),
            ]);
            setStats({
              metrics: {
                pendingResetCount: pendingResets.length,
                pendingUserCount: pendingUsers.length,
              },
              recent: {
                resetRequests: pendingResets.slice(0, 5),
                pendingUsers: pendingUsers.slice(0, 5),
              },
            });
          } catch (e2) {
            setError(e2?.response?.data?.message || 'İstatistikler yüklenemedi');
          }
        } else {
          setError(err?.response?.data?.message || 'İstatistikler yüklenemedi');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const m = stats?.metrics || {};
  const recent = stats?.recent || {};

  return (
    <div className={a.pageWrap}>
      <header>
        <p className={a.eyebrow}>Genel bakış</p>
        <h2 className={a.title}>Admin paneli</h2>
        <p className={a.subtitle}>
          Bekleyen işlemler ve kullanıcı özetleri tek ekranda. Kartlara tıklayarak ilgili sayfaya gidebilirsiniz.
        </p>
      </header>

      {error && <div className={a.alertError}>{error}</div>}

      {loading ? (
        <div className={a.loadingBox}>
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-teal-600" />
          Veriler yükleniyor…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              label="Bekleyen sıfırlama talepleri"
              value={m.pendingResetCount ?? '—'}
              onClick={() => navigate('/admin/reset-requests')}
              accent="teal"
            />
            <StatCard
              label="Bekleyen kullanıcı onayları"
              value={m.pendingUserCount ?? '—'}
              onClick={() => navigate('/admin/users')}
              accent="emerald"
            />
            <StatCard
              label="Okunmamış bildirimler"
              value={m.unreadNotifications ?? '—'}
              onClick={() => navigate('/admin/settings')}
              accent="slate"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Öğrenci" value={m.studentsCount ?? '—'} />
            <StatCard label="Öğretmen" value={m.teachersCount ?? '—'} />
            <StatCard label="Admin" value={m.adminsCount ?? '—'} />
            <StatCard label="Aktif / kapalı" value={`${m.activeUsersCount ?? '—'} / ${m.disabledUsersCount ?? '—'}`} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className={a.card}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Son sıfırlama talepleri
                </h3>
                <button type="button" className={a.btnSmOutline} onClick={() => navigate('/admin/reset-requests')}>
                  Tümü
                </button>
              </div>
              <div className={a.tableWrap}>
                <table className={a.table}>
                  <thead>
                    <tr>
                      <th className={a.th}>E-posta</th>
                      <th className={a.th}>Not</th>
                      <th className={a.th}>Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recent.resetRequests || []).map((r) => (
                      <tr key={r._id} className={a.tr}>
                        <td className={`${a.td} font-medium text-slate-900 dark:text-slate-100`}>{r.email}</td>
                        <td className={`${a.td} max-w-[140px] truncate text-slate-500`}>{r.note || '—'}</td>
                        <td className={`${a.td} whitespace-nowrap text-xs text-slate-500`}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                    {(!recent.resetRequests || recent.resetRequests.length === 0) && (
                      <tr>
                        <td className={`${a.td} py-8 text-center text-slate-500`} colSpan={3}>
                          Kayıt yok
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={a.card}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Son bekleyen kullanıcılar
                </h3>
                <button type="button" className={a.btnSmOutline} onClick={() => navigate('/admin/users')}>
                  Tümü
                </button>
              </div>
              <div className={a.tableWrap}>
                <table className={a.table}>
                  <thead>
                    <tr>
                      <th className={a.th}>Ad</th>
                      <th className={a.th}>E-posta</th>
                      <th className={a.th}>Rol</th>
                      <th className={a.th}>Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recent.pendingUsers || []).map((u) => (
                      <tr key={u._id} className={a.tr}>
                        <td className={`${a.td} font-medium text-slate-900 dark:text-slate-100`}>{u.name}</td>
                        <td className={`${a.td} text-slate-600 dark:text-slate-300`}>{u.email}</td>
                        <td className={a.td}>
                          <span className={a.badgeRole(u.role)}>{u.role}</span>
                        </td>
                        <td className={`${a.td} whitespace-nowrap text-xs text-slate-500`}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                    {(!recent.pendingUsers || recent.pendingUsers.length === 0) && (
                      <tr>
                        <td className={`${a.td} py-8 text-center text-slate-500`} colSpan={4}>
                          Kayıt yok
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
