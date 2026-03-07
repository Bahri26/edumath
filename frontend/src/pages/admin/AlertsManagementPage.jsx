import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Trash2, AlertCircle, AlertTriangle, Info, Zap } from 'lucide-react';

const AlertsManagementPage = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAlert, setNewAlert] = useState({
        title: '',
        message: '',
        severity: 'info'
    });

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const res = await api.get('/admin_alerts?limit=500');
            const payload = res.data && (res.data.data !== undefined ? res.data.data : (res.data.rows !== undefined ? res.data.rows : res.data));
            const list = Array.isArray(payload) ? payload : (payload.alerts || payload.rows || []);
            setAlerts(list || []);
        } catch (error) {
            console.error('Alert\'ler yüklenemedi:', error);
            setAlerts([]); // Hata durumunda boş array
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newAlert.title.trim() || !newAlert.message.trim()) {
            alert('⚠️ Başlık ve mesaj alanları zorunludur!');
            return;
        }

        try {
            await api.post('/admin_alerts', newAlert);
            alert('✅ Alert başarıyla oluşturuldu!');
            setShowCreateModal(false);
            setNewAlert({ title: '', message: '', severity: 'info' });
            fetchAlerts();
        } catch (error) {
            alert('❌ Alert oluşturulamadı: ' + (error.response?.data?.message || 'Hata'));
        }
    };

    const handleMarkAsRead = async (alertId) => {
        try {
            await api.put(`/admin_alerts/${alertId}/read`);
            fetchAlerts();
        } catch (error) {
            console.error('Alert okundu işaretlenemedi:', error);
        }
    };

    const handleDelete = async (alertId, title) => {
        if (!window.confirm(`"${title}" alert'ini silmek istediğinize emin misiniz?`)) return;

        try {
            await api.delete(`/admin_alerts/${alertId}`);
            alert('✅ Alert silindi!');
            fetchAlerts();
        } catch (error) {
            alert('❌ Silme başarısız: ' + (error.response?.data?.message || 'Hata'));
        }
    };

    if (loading) {
        return (
            <div className="p-10 text-center">
                <div className="text-6xl animate-bounce mb-4">⏳</div>
                <p className="text-gray-600 dark:text-slate-400 font-medium">Alert'ler Yükleniyor...</p>
            </div>
        );
    }

    const unreadCount = alerts.filter(a => a.status === 'unread').length;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-2 flex items-center gap-3">
                        🔔 Alert Yönetimi
                        {unreadCount > 0 && (
                            <span className="text-lg bg-red-600 text-white px-3 py-1 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400">
                        Sistem alert'lerini oluştur ve yönet
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-indigo-900"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Alert
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard
                    icon={<Bell className="w-6 h-6" />}
                    label="Toplam"
                    value={alerts.length}
                    color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <StatCard
                    icon={<AlertCircle className="w-6 h-6" />}
                    label="Okunmamış"
                    value={unreadCount}
                    color="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                />
                <StatCard
                    icon={<AlertTriangle className="w-6 h-6" />}
                    label="Kritik"
                    value={alerts.filter(a => a.severity === 'critical' || a.severity === 'error').length}
                    color="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                />
                <StatCard
                    icon={<Info className="w-6 h-6" />}
                    label="Bilgi"
                    value={alerts.filter(a => a.severity === 'info').length}
                    color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                />
            </div>

            {/* Alerts List */}
            <div className="space-y-4">
                {alerts.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-20 text-center">
                        <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                        <p className="text-gray-400 dark:text-slate-500 text-lg">Henüz alert yok</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
                        >
                            İlk Alert'i Oluştur
                        </button>
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <motion.div
                            key={alert.alert_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-2xl shadow-sm border p-6 hover:shadow-md transition ${alert.status === 'unread'
                                    ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700'
                                    : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 opacity-60'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <SeverityIcon severity={alert.severity} />
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                            {alert.title}
                                        </h3>
                                        <SeverityBadge severity={alert.severity} />
                                        {alert.status === 'unread' && (
                                            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                                                Yeni
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 dark:text-slate-400 mb-4">
                                        {alert.message}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-500">
                                        <span>📅 {new Date(alert.created_at).toLocaleDateString('tr-TR')}</span>
                                        <span>🕐 {new Date(alert.created_at).toLocaleTimeString('tr-TR')}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {alert.status === 'unread' && (
                                        <button
                                            onClick={() => handleMarkAsRead(alert.alert_id)}
                                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition text-green-600 dark:text-green-400"
                                            title="Okundu işaretle"
                                        >
                                            <Zap className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(alert.alert_id, alert.title)}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600 dark:text-red-400"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Yeni Alert Oluştur</h3>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">
                                        Başlık *
                                    </label>
                                    <input
                                        type="text"
                                        value={newAlert.title}
                                        onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                                        placeholder="Alert başlığı..."
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">
                                        Önem Seviyesi *
                                    </label>
                                    <select
                                        value={newAlert.severity}
                                        onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="info">ℹ️ Bilgi</option>
                                        <option value="warning">⚠️ Uyarı</option>
                                        <option value="error">❌ Hata</option>
                                        <option value="critical">🚨 Kritik</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">
                                        Mesaj *
                                    </label>
                                    <textarea
                                        value={newAlert.message}
                                        onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                                        placeholder="Alert mesajı..."
                                        rows="4"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-indigo-900"
                                >
                                    Oluştur
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper Components
const StatCard = ({ icon, label, value, color }) => (
    <div className={`${color} rounded-xl p-4 flex items-center gap-3`}>
        {icon}
        <div>
            <div className="text-2xl font-black">{value}</div>
            <div className="text-xs font-bold opacity-80">{label}</div>
        </div>
    </div>
);

const SeverityIcon = ({ severity }) => {
    const icons = {
        info: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
        error: <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
        critical: <Zap className="w-5 h-5 text-red-600 dark:text-red-400" />
    };
    return icons[severity] || icons.info;
};

const SeverityBadge = ({ severity }) => {
    const badges = {
        info: { label: 'Bilgi', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        warning: { label: 'Uyarı', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
        error: { label: 'Hata', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
        critical: { label: 'Kritik', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    };
    const badge = badges[severity] || badges.info;
    return <span className={`px-3 py-1 rounded-lg text-xs font-bold ${badge.class}`}>{badge.label}</span>;
};

export default AlertsManagementPage;
