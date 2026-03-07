import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTheme } from '../../hooks/useTheme';

/**
 * 🚨 ADMIN ALERTS PANEL
 * Admin uyarılarını görüntüle ve yönet
 */
export default function AdminAlertBadge({ className = '' }) {
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showPanel, setShowPanel] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        fetchAlerts();
        // Her 30 saniyede yenile
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        try {
            const res = await api.get('/admin_alerts?unreadOnly=true&limit=50');
            const payload = res.data && (res.data.data !== undefined ? res.data.data : (res.data.rows !== undefined ? res.data.rows : res.data));
            // payload may be an array or an object with alerts/stats
            const alertsList = Array.isArray(payload) ? payload : (payload.alerts || payload.rows || payload);
            const unread = (payload && (payload.stats && payload.stats.unread)) || (payload && payload.unread) || 0;
            setAlerts(alertsList || []);
            setUnreadCount(unread || 0);
        } catch (error) {
            console.error('❌ Alert fetch error:', error);
        }
    };

    const handleMarkAsRead = async (alertId) => {
        try {
            await api.put(`/admin_alerts/${alertId}/read`);
            await fetchAlerts();
        } catch (error) {
            console.error('❌ Mark read error:', error);
        }
    };

    const handleDelete = async (alertId) => {
        try {
            await api.delete(`/admin_alerts/${alertId}`);
            await fetchAlerts();
        } catch (error) {
            console.error('❌ Delete error:', error);
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
            case 'high': return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700';
            case 'medium': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
            case 'low': return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
            case 'info': return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
            default: return 'bg-gray-100 dark:bg-gray-700';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical': return '🔴';
            case 'high': return '🟠';
            case 'medium': return '🟡';
            case 'low': return '🔵';
            case 'info': return 'ℹ️';
            default: return '❓';
        }
    };

    return (
        <div className={className}>
            {/* Alert Bell Button */}
            <div className="relative">
                <button
                    onClick={() => setShowPanel(!showPanel)}
                    className={`relative p-2 rounded-lg transition-all hover:scale-110 ${
                        theme === 'dark'
                            ? 'hover:bg-slate-800'
                            : 'hover:bg-gray-100'
                    }`}
                    title="Sistem Uyarıları"
                >
                    <span className="text-2xl">🔔</span>
                    {unreadCount > 0 && (
                        <span className={`absolute top-0 right-0 w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center animate-pulse`}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Alert Panel */}
                {showPanel && (
                    <div className={`fixed sm:absolute right-0 sm:right-0 left-0 sm:left-auto bottom-0 sm:top-full sm:mt-2 sm:w-96 max-h-96 rounded-t-2xl sm:rounded-xl shadow-2xl border overflow-hidden z-50 ${
                        theme === 'dark'
                            ? 'bg-slate-800 border-slate-700'
                            : 'bg-white border-gray-200'
                    }`}>
                        {/* Header */}
                        <div className={`p-3 sm:p-4 border-b font-bold text-base sm:text-lg ${
                            theme === 'dark'
                                ? 'bg-slate-700 border-slate-600 text-white'
                                : 'bg-gray-100 border-gray-200 text-gray-900'
                        }`}>
                            🚨 Uyarılar ({unreadCount})
                        </div>

                        {/* Alerts List */}
                        <div className="overflow-y-auto max-h-80">
                            {alerts.length === 0 ? (
                                <div className={`p-6 text-center ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                    ✅ Tüm sistemler normal çalışıyor!
                                </div>
                            ) : (
                                alerts.map(alert => (
                                    <div
                                        key={alert.alert_id}
                                        className={`p-3 sm:p-4 border-b ${getSeverityColor(alert.severity)} border-opacity-50 hover:opacity-80 transition-opacity cursor-pointer`}
                                    >
                                        <div className="flex justify-between items-start gap-2 sm:gap-3 mb-2">
                                            <div className="flex gap-2 items-start flex-1 min-w-0">
                                                <span className="text-lg sm:text-xl flex-shrink-0">{getSeverityIcon(alert.severity)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-xs sm:text-sm truncate">
                                                        {alert.title}
                                                    </h4>
                                                    <p className="text-xs opacity-80 line-clamp-2">
                                                        {alert.message}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(alert.alert_id);
                                                }}
                                                className="text-xs opacity-60 hover:opacity-100 flex-shrink-0"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                                            <span className={`text-xs opacity-60`}>
                                                {new Date(alert.created_at).toLocaleTimeString('tr-TR')}
                                            </span>
                                            {!alert.is_read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(alert.alert_id);
                                                    }}
                                                    className="text-xs font-bold opacity-80 hover:opacity-100 underline"
                                                >
                                                    Okktu işaretle
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className={`p-2 sm:p-3 border-t text-center text-xs ${
                            theme === 'dark'
                                ? 'bg-slate-700 border-slate-600 text-slate-300'
                                : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}>
                            Son güncelleme: {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
