import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Plus, Trash2, Users, GraduationCap, BookOpen, Edit2 } from 'lucide-react';

const AnnouncementsPage = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        message: '',
        target_role: 'all'
    });
    const [editAnnouncement, setEditAnnouncement] = useState({
        id: null,
        title: '',
        message: '',
        target_role: 'all'
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/admin/announcements');
            setAnnouncements(res.data.data || []);
        } catch (error) {
            console.error('Duyurular yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
            alert('⚠️ Başlık ve mesaj alanları zorunludur!');
            return;
        }

        try {
            await api.post('/admin/announcements', newAnnouncement);
            alert('✅ Duyuru başarıyla yayınlandı!');
            setShowCreateModal(false);
            setNewAnnouncement({ title: '', message: '', target_role: 'all' });
            fetchAnnouncements();
        } catch (error) {
            alert('❌ Duyuru oluşturulamadı: ' + (error.response?.data?.message || 'Hata'));
        }
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(`"${title}" duyurusunu silmek istediğinize emin misiniz?`)) return;

        try {
            await api.delete(`/admin/announcements/${id}`);
            alert('✅ Duyuru silindi!');
            fetchAnnouncements();
        } catch (error) {
            alert('❌ Silme başarısız: ' + (error.response?.data?.message || 'Hata'));
        }
    };

    const openEditModal = (announcement) => {
        setEditAnnouncement({
            id: announcement.id,
            title: announcement.title || '',
            message: announcement.message || '',
            target_role: announcement.target_role || 'all'
        });
        setShowEditModal(true);
    };

    const handleUpdate = async () => {
        if (!editAnnouncement.title.trim() || !editAnnouncement.message.trim()) {
            alert('⚠️ Başlık ve mesaj alanları zorunludur!');
            return;
        }

        try {
            await api.put(`/admin/announcements/${editAnnouncement.id}`, {
                title: editAnnouncement.title,
                message: editAnnouncement.message,
                target_role: editAnnouncement.target_role
            });
            alert('✅ Duyuru güncellendi!');
            setShowEditModal(false);
            fetchAnnouncements();
        } catch (error) {
            alert('❌ Duyuru güncellenemedi: ' + (error.response?.data?.message || 'Hata'));
        }
    };

    if (loading) {
        return (
            <div className="p-10 text-center">
                <div className="text-6xl animate-bounce mb-4">⏳</div>
                <p className="text-gray-600 dark:text-slate-400 font-medium">Duyurular Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-2">
                        📢 Duyuru Yönetimi
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400">
                        Sistem geneli duyurular oluştur ve yönet
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-indigo-900"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Duyuru
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard
                    icon={<Megaphone className="w-6 h-6" />}
                    label="Toplam Duyuru"
                    value={announcements.length}
                    color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <StatCard
                    icon={<Users className="w-6 h-6" />}
                    label="Herkese"
                    value={announcements.filter(a => a.target_role === 'all').length}
                    color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                />
                <StatCard
                    icon={<GraduationCap className="w-6 h-6" />}
                    label="Öğretmenlere"
                    value={announcements.filter(a => a.target_role === 'teacher').length}
                    color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                />
                <StatCard
                    icon={<BookOpen className="w-6 h-6" />}
                    label="Öğrencilere"
                    value={announcements.filter(a => a.target_role === 'student').length}
                    color="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                />
            </div>

            {/* Announcements List */}
            <div className="space-y-4">
                {announcements.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-20 text-center">
                        <Megaphone className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
                        <p className="text-gray-400 dark:text-slate-500 text-lg">Henüz duyuru yok</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition"
                        >
                            İlk Duyuruyu Oluştur
                        </button>
                    </div>
                ) : (
                    announcements.map((announcement) => (
                        <motion.div
                            key={announcement.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                            {announcement.title}
                                        </h3>
                                        <TargetBadge target={announcement.target_role} />
                                    </div>
                                    <p className="text-gray-600 dark:text-slate-400 mb-4 whitespace-pre-wrap">
                                        {announcement.message}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-500">
                                        <span>📅 {new Date(announcement.created_at).toLocaleDateString('tr-TR')}</span>
                                        <span>🕐 {new Date(announcement.created_at).toLocaleTimeString('tr-TR')}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openEditModal(announcement)}
                                    className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition text-indigo-600 dark:text-indigo-400"
                                    title="Düzenle"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(announcement.id, announcement.title)}
                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600 dark:text-red-400"
                                    title="Sil"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
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
                                <Megaphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Yeni Duyuru Oluştur</h3>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">
                                        Başlık *
                                    </label>
                                    <input
                                        type="text"
                                        value={newAnnouncement.title}
                                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                        placeholder="Duyuru başlığı..."
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">
                                        Hedef Kitle *
                                    </label>
                                    <select
                                        value={newAnnouncement.target_role}
                                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, target_role: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="all">Tüm Kullanıcılar</option>
                                        <option value="teacher">Sadece Öğretmenler</option>
                                        <option value="student">Sadece Öğrenciler</option>
                                        <option value="admin">Sadece Adminler</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">
                                        Mesaj *
                                    </label>
                                    <textarea
                                        value={newAnnouncement.message}
                                        onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                                        placeholder="Duyuru mesajınızı buraya yazın..."
                                        rows="6"
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
                                    Yayınla
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <Edit2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Duyuru Düzenle</h3>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">Başlık *</label>
                                    <input
                                        type="text"
                                        value={editAnnouncement.title}
                                        onChange={(e) => setEditAnnouncement({ ...editAnnouncement, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">Hedef Kitle *</label>
                                    <select
                                        value={editAnnouncement.target_role}
                                        onChange={(e) => setEditAnnouncement({ ...editAnnouncement, target_role: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="all">Tüm Kullanıcılar</option>
                                        <option value="teacher">Sadece Öğretmenler</option>
                                        <option value="student">Sadece Öğrenciler</option>
                                        <option value="admin">Sadece Adminler</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">Mesaj *</label>
                                    <textarea
                                        value={editAnnouncement.message}
                                        onChange={(e) => setEditAnnouncement({ ...editAnnouncement, message: e.target.value })}
                                        rows="6"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-indigo-900"
                                >
                                    Güncelle
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

const TargetBadge = ({ target }) => {
    const badges = {
        all: { label: '🌐 Herkes', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        teacher: { label: '👨‍🏫 Öğretmenler', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
        student: { label: '🎓 Öğrenciler', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        admin: { label: '🛡️ Adminler', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
    };
    const badge = badges[target] || badges.all;
    return <span className={`px-3 py-1 rounded-lg text-xs font-bold ${badge.class}`}>{badge.label}</span>;
};

export default AnnouncementsPage;
