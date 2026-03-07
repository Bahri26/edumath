import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import AdminAIConsole from '../../components/admin/AdminAIConsole';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ users: {}, content: {} });
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleTabChange = (tabId) => {
        if (tabId === 'users') {
            navigate('/admin/users');
            return;
        }
        setActiveTab(tabId);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, usersRes, logsRes] = await Promise.allSettled([
                    api.get('/admin/stats'),
                    api.get('/admin/users'),
                    api.get('/admin/logs')
                ]);

                if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.data);
                if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.data);
                if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data.data);
            } catch (error) {
                console.error("Veri çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // role guard: only admins may view this page
    useEffect(() => {
        const storedUser = localStorage.getItem('edumath_user');
        if (storedUser) {
            try {
                const u = JSON.parse(storedUser);
                if (u.role !== 'admin') {
                    navigate('/');
                }
            } catch (e) {
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    if (loading) return <div className="p-10 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-10 font-sans">
            
            {/* --- BAŞLIK ALANI --- */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                        Yönetim Paneli <span className="text-indigo-600 dark:text-indigo-400 text-sm bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">v2.0</span>
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-2">Sistemin genel durumunu ve aktiviteleri buradan yönet.</p>
                </div>
                
                {/* Hızlı Aksiyon Butonları */}
                <div className="flex gap-3 mt-4 md:mt-0">
                    <button onClick={() => navigate('/admin/announcements')} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 px-4 py-2 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-sm">
                        📢 Duyuru Yap
                    </button>
                    <button onClick={() => navigate('/admin/users')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
                        👥 Kullanıcılar
                    </button>
                </div>
            </div>

            {/* --- SEKMELER --- */}
            <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-slate-700 pb-1 overflow-x-auto">
                <TabButton id="overview" label="Genel Bakış" icon="📈" active={activeTab} onClick={handleTabChange} />
                <TabButton id="users" label="Kullanıcılar" icon="👥" active={activeTab} onClick={handleTabChange} />
                <TabButton id="logs" label="Sistem Logları" icon="💻" active={activeTab} onClick={handleTabChange} />
                <TabButton id="aiops" label="AI Operations" icon="🤖" active={activeTab} onClick={handleTabChange} />
            </div>

            {/* --- İÇERİK ALANI --- */}
            <AnimatePresence mode="wait">
                
                {/* 1. SEKME: GENEL BAKIŞ */}
                {activeTab === 'overview' && (
                    <motion.div 
                        key="overview"
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* İstatistik Kartları */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Toplam Kullanıcı" value={stats?.users?.totalUsers || 0} icon="👥" color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
                            <StatCard title="Öğretmenler" value={stats?.users?.totalTeachers || 0} icon="🎓" color="text-purple-600" bg="bg-purple-50 dark:bg-purple-900/20" />
                            <StatCard title="Öğrenciler" value={stats?.users?.totalStudents || 0} icon="✏️" color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
                            <StatCard title="Soru Havuzu" value={stats?.content?.totalQuestions || 0} icon="📦" color="text-orange-600" bg="bg-orange-50 dark:bg-orange-900/20" />
                        </div>

                        {/* Yönetim Kartları */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <QuickActionCard onClick={() => navigate('/admin/users')} icon="👥" label="Kullanıcı Yönetimi" color="bg-blue-500" />
                            <QuickActionCard onClick={() => navigate('/admin/announcements')} icon="📢" label="Duyurular" color="bg-purple-500" />
                            <QuickActionCard onClick={() => navigate('/admin/reports')} icon="🚩" label="Soru Raporları" color="bg-orange-500" />
                            <QuickActionCard onClick={() => navigate('/admin/alerts')} icon="🔔" label="Alert Sistemi" color="bg-red-500" />
                            <QuickActionCard onClick={() => navigate('/admin/approvals')} icon="🛡️" label="Onay Merkezi" color="bg-green-500" />
                            <QuickActionCard onClick={() => navigate('/admin/settings')} icon="⚙️" label="Sistem Ayarları" color="bg-gray-500" />
                            <QuickActionCard onClick={() => navigate('/admin/logs')} icon="📋" label="Audit Logları" color="bg-indigo-500" />
                            <QuickActionCard onClick={() => setActiveTab('aiops')} icon="🤖" label="AI Operations" color="bg-pink-500" />
                        </div>

                        {/* Alt Kısım */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-4">Son Aktiviteler</h3>
                                <div className="space-y-4">
                                    {Array.isArray(logs) && logs.slice(0, 5).map(log => (
                                        <div key={log.log_id} className="flex items-center gap-3 text-sm">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                            <span className="text-gray-600 dark:text-slate-400 flex-1">{log.description}</span>
                                            <span className="text-gray-400 dark:text-slate-500 text-xs">{new Date(log.created_at).toLocaleTimeString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-lg text-white flex flex-col justify-center items-center text-center">
                                <div className="text-5xl mb-4">🤖</div>
                                <h3 className="font-bold text-xl mb-2">AI Sistem Analizi</h3>
                                <p className="text-indigo-100 text-sm mb-6">Sistem sağlığı %98 oranında stabil. Son 24 saatte kritik hata tespit edilmedi.</p>
                                <button onClick={() => setActiveTab('aiops')} className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-xl font-bold transition">Detaylı Analiz</button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 2. SEKME: KULLANICILAR */}
                {activeTab === 'users' && (
                    <motion.div 
                        key="users"
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 font-bold text-xs uppercase">
                                    <tr>
                                        <th className="p-5">Kullanıcı</th>
                                        <th className="p-5">Rol</th>
                                        <th className="p-5">Durum</th>
                                        <th className="p-5 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {Array.isArray(users) && users.map(user => (
                                        <tr key={user.user_id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-700/30 transition">
                                            <td className="p-5">
                                                <div className="font-bold text-gray-800 dark:text-white">{user.full_name}</div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400">{user.email}</div>
                                            </td>
                                            <td className="p-5"><Badge role={user.role_id} /></td>
                                            <td className="p-5">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                    {user.is_active ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right">
                                                <button
                                                    onClick={() => navigate(`/admin/users?edit=${user.user_id}`)}
                                                    className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold"
                                                >
                                                    Düzenle
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* 3. SEKME: LOGLAR */}
                {activeTab === 'logs' && (
                    <motion.div 
                        key="logs"
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-700 p-6 min-h-[500px]">
                            <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-slate-400 text-xs font-mono ml-2">system_audit.log</span>
                            </div>
                            <div className="font-mono text-sm space-y-2">
                                {Array.isArray(logs) && logs.map(log => (
                                    <div key={log.log_id} className="flex gap-4 text-slate-300 hover:bg-white/5 p-1 rounded">
                                        <span className="text-slate-500 w-32">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                        <span className="text-green-400 w-24 font-bold">{log.action_type}</span>
                                        <span className="flex-1">{log.description}</span>
                                        <span className="text-slate-600 text-xs">{log.ip_address}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 4. SEKME: AI OPS */}
                {activeTab === 'aiops' && (
                    <motion.div 
                        key="aiops"
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <AdminAIConsole />
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};

// --- YARDIMCI BİLEŞENLER ---

const StatCard = ({ title, value, icon, color, bg }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className={`${bg} p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-5`}
    >
        <div className={`w-16 h-16 ${bg} ${color} rounded-2xl flex items-center justify-center text-3xl`}>
            {icon}
        </div>
        <div>
            <h3 className="text-3xl font-black text-gray-800 dark:text-white">{value}</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        </div>
    </motion.div>
);

const TabButton = ({ id, label, icon, active, onClick }) => (
    <button 
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
            active === id 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900' 
            : 'text-gray-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-white'
        }`}
    >
        <span>{icon}</span> {label}
    </button>
);

const Badge = ({ role }) => {
    const roles = { 
        1: { l: 'Admin', c: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' }, 
        2: { l: 'Öğretmen', c: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' }, 
        3: { l: 'Öğrenci', c: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' } 
    };
    const r = roles[role] || roles[3];
    return <span className={`px-3 py-1 rounded-lg text-xs font-bold ${r.c}`}>{r.l}</span>;
};

const QuickActionCard = ({ onClick, icon, label, color }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`${color} text-white rounded-xl p-4 text-center font-bold shadow-lg hover:shadow-xl transition-all`}
    >
        <div className="text-3xl mb-2">{icon}</div>
        <div className="text-sm">{label}</div>
    </motion.button>
);

export default AdminDashboard;
