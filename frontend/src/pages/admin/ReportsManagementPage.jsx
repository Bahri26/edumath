import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';

const ReportsManagementPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get('/admin/reports');
            setReports(res.data.data || []);
        } catch (error) {
            console.error('Raporlar yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (reportId, status) => {
        const action = status === 'resolved' ? 'çözüldü' : 'yoksayıldı';
        if (!window.confirm(`Bu raporu "${action}" olarak işaretlemek istediğinize emin misiniz?`)) return;

        try {
            await api.put('/admin/reports/resolve', { reportId, status });
            alert(`✅ Rapor ${action} olarak işaretlendi!`);
            fetchReports();
            setSelectedReport(null);
        } catch (error) {
            alert('❌ İşlem başarısız: ' + (error.response?.data?.message || 'Hata'));
        }
    };

    const filteredReports = reports.filter(r => r.status === filter);

    if (loading) {
        return (
            <div className="p-10 text-center">
                <div className="text-6xl animate-bounce mb-4">⏳</div>
                <p className="text-gray-600 dark:text-slate-400 font-medium">Raporlar Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-10">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-2">
                    🚩 Soru Şikayet Yönetimi
                </h1>
                <p className="text-gray-500 dark:text-slate-400">
                    Kullanıcılar tarafından bildirilen sorunlu soruları incele ve çöz
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <StatCard
                    icon={<AlertTriangle className="w-6 h-6" />}
                    label="Bekleyen"
                    value={reports.filter(r => r.status === 'pending').length}
                    color="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                />
                <StatCard
                    icon={<CheckCircle className="w-6 h-6" />}
                    label="Çözüldü"
                    value={reports.filter(r => r.status === 'resolved').length}
                    color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                />
                <StatCard
                    icon={<XCircle className="w-6 h-6" />}
                    label="Yoksayıldı"
                    value={reports.filter(r => r.status === 'ignored').length}
                    color="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 bg-white dark:bg-slate-800 rounded-xl p-2 border border-gray-200 dark:border-slate-700 w-fit">
                <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')} label="Bekleyen" />
                <FilterButton active={filter === 'resolved'} onClick={() => setFilter('resolved')} label="Çözüldü" />
                <FilterButton active={filter === 'ignored'} onClick={() => setFilter('ignored')} label="Yoksayıldı" />
            </div>

            {/* Reports List */}
            <div className="space-y-4">
                {filteredReports.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-20 text-center">
                        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                        <p className="text-gray-400 dark:text-slate-500 text-lg">
                            {filter === 'pending' ? 'Bekleyen rapor yok' : `${filter === 'resolved' ? 'Çözülmüş' : 'Yoksayılmış'} rapor yok`}
                        </p>
                    </div>
                ) : (
                    filteredReports.map((report) => (
                        <motion.div
                            key={report.report_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition"
                        >
                            <div className="flex justify-between items-start gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                        <span className="text-sm font-bold text-gray-500 dark:text-slate-400">
                                            Rapor #{report.report_id}
                                        </span>
                                        <StatusBadge status={report.status} />
                                    </div>

                                    <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 mb-4">
                                        <h4 className="text-sm font-bold text-gray-600 dark:text-slate-400 mb-2">Bildirilen Soru:</h4>
                                        <p className="text-gray-800 dark:text-white font-medium">{report.content_text}</p>
                                    </div>

                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
                                        <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Şikayet Nedeni:</h4>
                                        <p className="text-gray-700 dark:text-slate-300">{report.description || 'Açıklama belirtilmemiş'}</p>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-500">
                                        <span>👤 {report.reporter_name}</span>
                                        <span>📧 {report.reporter_email}</span>
                                        <span>📅 {new Date(report.created_at).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                </div>

                                {report.status === 'pending' && (
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleResolve(report.report_id, 'resolved')}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-lg shadow-green-200 dark:shadow-green-900"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Çözüldü
                                        </button>
                                        <button
                                            onClick={() => handleResolve(report.report_id, 'ignored')}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Yoksay
                                        </button>
                                        <button
                                            onClick={() => window.open(`/edit-question/${report.question_id}`, '_blank')}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Soruyu Gör
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
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

const FilterButton = ({ active, onClick, label }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg font-bold transition ${active
            ? 'bg-indigo-600 text-white shadow-lg'
            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
    >
        {label}
    </button>
);

const StatusBadge = ({ status }) => {
    const badges = {
        pending: { label: '⏳ Bekliyor', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
        resolved: { label: '✅ Çözüldü', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        ignored: { label: '⛔ Yoksayıldı', class: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' }
    };
    const badge = badges[status] || badges.pending;
    return <span className={`px-3 py-1 rounded-lg text-xs font-bold ${badge.class}`}>{badge.label}</span>;
};

export default ReportsManagementPage;
