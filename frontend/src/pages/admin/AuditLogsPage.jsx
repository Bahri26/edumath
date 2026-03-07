import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, Download, Calendar } from 'lucide-react';

const AuditLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [filterDate, setFilterDate] = useState('all');
    const [page, setPage] = useState(1);
    const logsPerPage = 50;

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [logs, searchTerm, filterAction, filterDate]);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/admin/logs', {
                params: { limit: 500, offset: 0 }
            });
            setLogs(res.data.data || []);
        } catch (error) {
            console.error('Loglar yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = logs;

        // Action filtresi
        if (filterAction !== 'all') {
            filtered = filtered.filter(log => log.action_type === filterAction);
        }

        // Tarih filtresi
        if (filterDate !== 'all') {
            const now = new Date();
            const filterDate24h = new Date(now - 24 * 60 * 60 * 1000);
            const filterDate7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
            const filterDate30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

            filtered = filtered.filter(log => {
                const logDate = new Date(log.created_at);
                switch (filterDate) {
                    case '24h': return logDate > filterDate24h;
                    case '7d': return logDate > filterDate7d;
                    case '30d': return logDate > filterDate30d;
                    default: return true;
                }
            });
        }

        // Arama filtresi
        if (searchTerm) {
            filtered = filtered.filter(log =>
                log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.ip_address?.includes(searchTerm)
            );
        }

        setFilteredLogs(filtered);
    };

    const exportLogs = () => {
        const csvContent = [
            ['Tarih', 'Saat', 'İşlem', 'Açıklama', 'Admin', 'IP'],
            ...filteredLogs.map(log => [
                new Date(log.created_at).toLocaleDateString('tr-TR'),
                new Date(log.created_at).toLocaleTimeString('tr-TR'),
                log.action_type,
                log.description,
                log.admin_name || '-',
                log.ip_address || '-'
            ])
        ].map(row => row.join(';')).join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const uniqueActions = [...new Set(logs.map(l => l.action_type))];

    // Pagination
    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
    const displayedLogs = filteredLogs.slice((page - 1) * logsPerPage, page * logsPerPage);

    if (loading) {
        return (
            <div className="p-10 text-center">
                <div className="text-6xl animate-bounce mb-4">⏳</div>
                <p className="text-gray-600 dark:text-slate-400 font-medium">Loglar Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-2">
                        📋 Sistem Audit Logları
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400">
                        Tüm sistem aktivitelerini detaylı görüntüle
                    </p>
                </div>
                <button
                    onClick={exportLogs}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200 dark:shadow-green-900"
                >
                    <Download className="w-5 h-5" />
                    CSV İndir
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard label="Toplam Log" value={logs.length} color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" />
                <StatCard label="Filtrelenmiş" value={filteredLogs.length} color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" />
                <StatCard label="Bugün" value={logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length} color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" />
                <StatCard label="İşlem Tipi" value={uniqueActions.length} color="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" />
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
                <div className="grid md:grid-cols-3 gap-4">
                    {/* Arama */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Log ara (açıklama, admin, IP)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                    </div>

                    {/* İşlem Filtresi */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                        >
                            <option value="all">Tüm İşlemler</option>
                            {uniqueActions.map(action => (
                                <option key={action} value={action}>{action}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tarih Filtresi */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                        >
                            <option value="all">Tüm Zamanlar</option>
                            <option value="24h">Son 24 Saat</option>
                            <option value="7d">Son 7 Gün</option>
                            <option value="30d">Son 30 Gün</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
                <div className="flex items-center gap-2 p-4 border-b border-slate-700">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-slate-400 text-xs font-mono ml-2">audit_logs.log</span>
                    <span className="text-slate-600 text-xs ml-auto">Sayfa {page}/{totalPages}</span>
                </div>

                <div className="p-6 font-mono text-sm max-h-[600px] overflow-y-auto">
                    {displayedLogs.length === 0 ? (
                        <div className="text-center py-20">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                            <p className="text-slate-400">Eşleşen log bulunamadı</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {displayedLogs.map((log, idx) => (
                                <motion.div
                                    key={log.log_id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.01 }}
                                    className="flex gap-4 text-slate-300 hover:bg-white/5 p-2 rounded transition"
                                >
                                    <span className="text-slate-500 w-20 flex-shrink-0">
                                        [{new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                    </span>
                                    <span className={`w-32 flex-shrink-0 font-bold ${getActionColor(log.action_type)}`}>
                                        {log.action_type}
                                    </span>
                                    <span className="flex-1">{log.description}</span>
                                    {log.admin_name && (
                                        <span className="text-blue-400 w-40 flex-shrink-0 text-right">@{log.admin_name}</span>
                                    )}
                                    {log.ip_address && (
                                        <span className="text-slate-600 w-32 flex-shrink-0 text-right text-xs">{log.ip_address}</span>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t border-slate-700 p-4 flex justify-center gap-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Önceki
                        </button>
                        <span className="px-4 py-2 text-slate-400">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Sonraki →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper Components
const StatCard = ({ label, value, color }) => (
    <div className={`${color} rounded-xl p-4 text-center`}>
        <div className="text-2xl font-black">{value}</div>
        <div className="text-xs font-bold opacity-80">{label}</div>
    </div>
);

const getActionColor = (action) => {
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'text-red-400';
    if (action.includes('CREATE') || action.includes('ADD')) return 'text-green-400';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'text-yellow-400';
    if (action.includes('LOGIN')) return 'text-blue-400';
    if (action.includes('ERROR')) return 'text-red-500';
    return 'text-purple-400';
};

export default AuditLogsPage;
