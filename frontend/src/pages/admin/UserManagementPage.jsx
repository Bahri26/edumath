import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Edit2, Trash2, ShieldOff, ShieldCheck, UserCog } from 'lucide-react';

const UserManagementPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [editingUser, setEditingUser] = useState(null);
    const [selectedCourseIds, setSelectedCourseIds] = useState([]);
    const [newPassword, setNewPassword] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);

    const openEditModal = (user) => {
        setEditingUser(user);
        setSelectedCourseIds(Array.isArray(user.course_ids) ? user.course_ids : []);
        setNewPassword('');
        setShowEditModal(true);
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [searchTerm, filterRole, users]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const editUserId = Number(params.get('edit') || 0);

        if (!editUserId || users.length === 0) return;

        const target = users.find((user) => Number(user.user_id) === editUserId);
        if (!target) return;

        openEditModal(target);
        navigate('/admin/users', { replace: true });
    }, [location.search, users, navigate]);

    const fetchInitialData = async () => {
        try {
            const [usersRes, coursesRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/courses')
            ]);
            setUsers(usersRes.data.data || []);
            setCourses(coursesRes.data.data || []);
        } catch (error) {
            console.error('Admin başlangıç verileri yüklenemedi:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data.data || []);
        } catch (error) {
            console.error('Kullanıcılar yüklenemedi:', error);
        }
    };

    const filterUsers = () => {
        let filtered = users;

        // Rol filtresi
        if (filterRole !== 'all') {
            filtered = filtered.filter(u => u.role_id === parseInt(filterRole));
        }

        // Arama filtresi
        if (searchTerm) {
            filtered = filtered.filter(u =>
                u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredUsers(filtered);
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        const action = currentStatus ? 'pasif' : 'aktif';
        if (!window.confirm(`Bu kullanıcıyı ${action} yapmak istediğinize emin misiniz?`)) return;

        try {
            await api.put('/admin/users/toggle-status', { userId });
            alert(`✅ Kullanıcı durumu ${action} olarak güncellendi!`);
            fetchUsers();
        } catch (error) {
            alert('❌ İşlem başarısız: ' + (error.response?.data?.message || 'Hata'));
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`⚠️ ${userName} kullanıcısını kalıcı olarak silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz!`)) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            alert('✅ Kullanıcı başarıyla silindi!');
            fetchUsers();
        } catch (error) {
            alert('❌ Silme başarısız: ' + (error.response?.data?.message || 'Hata'));
        }
    };

    const toggleCourseSelection = (courseId) => {
        setSelectedCourseIds((prev) =>
            prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
        );
    };

    const handleSaveUserChanges = async () => {
        const nextRoleId = editingUser.newRoleId || editingUser.role_id;
        const courseIdsSorted = [...selectedCourseIds].sort((first, second) => first - second);
        const currentCourseIdsSorted = [...(editingUser.course_ids || [])].sort((first, second) => first - second);

        const isRoleChanged = nextRoleId !== editingUser.role_id;
        const isCoursesChanged = JSON.stringify(courseIdsSorted) !== JSON.stringify(currentCourseIdsSorted);
        const isPasswordChanged = newPassword.trim().length > 0;

        if (!isRoleChanged && !isCoursesChanged && !isPasswordChanged) {
            setShowEditModal(false);
            return;
        }

        if (!window.confirm('Kullanıcı değişiklikleri kaydedilsin mi?')) return;

        try {
            if (isRoleChanged) {
                await api.put('/admin/users/update-role', {
                    userId: editingUser.user_id,
                    newRoleId: nextRoleId
                });
            }

            if (isCoursesChanged) {
                await api.put('/admin/users/update-courses', {
                    userId: editingUser.user_id,
                    courseIds: courseIdsSorted
                });
            }

            if (isPasswordChanged) {
                await api.put('/admin/users/update-password', {
                    userId: editingUser.user_id,
                    newPassword: newPassword.trim()
                });
            }

            alert('✅ Kullanıcı bilgileri güncellendi!');
            setShowEditModal(false);
            setNewPassword('');
            fetchUsers();
        } catch (error) {
            alert('❌ Güncelleme başarısız: ' + (error.response?.data?.message || 'Hata'));
        }
    };

    if (loading) {
        return (
            <div className="p-10 text-center">
                <div className="text-6xl animate-bounce mb-4">⏳</div>
                <p className="text-gray-600 dark:text-slate-400 font-medium">Kullanıcılar Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-10">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-2">
                    👥 Kullanıcı Yönetimi
                </h1>
                <p className="text-gray-500 dark:text-slate-400">
                    Tüm sistem kullanıcılarını görüntüle, düzenle ve yönet
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Arama */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="İsim veya email ile ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                        />
                    </div>

                    {/* Rol Filtresi */}
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    >
                        <option value="all">Tüm Roller</option>
                        <option value="1">Admin</option>
                        <option value="2">Öğretmen</option>
                        <option value="3">Öğrenci</option>
                    </select>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                    <StatBox label="Toplam" value={users.length} color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" />
                    <StatBox label="Admin" value={users.filter(u => u.role_id === 1).length} color="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" />
                    <StatBox label="Öğretmen" value={users.filter(u => u.role_id === 2).length} color="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" />
                    <StatBox label="Öğrenci" value={users.filter(u => u.role_id === 3).length} color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-slate-300 text-sm font-bold uppercase">
                            <tr>
                                <th className="px-6 py-4 text-left">Kullanıcı</th>
                                <th className="px-6 py-4 text-left">Rol</th>
                                <th className="px-6 py-4 text-left">Dersler</th>
                                <th className="px-6 py-4 text-left">Durum</th>
                                <th className="px-6 py-4 text-left">Kayıt Tarihi</th>
                                <th className="px-6 py-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {filteredUsers.map(user => (
                                <motion.tr
                                    key={user.user_id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-indigo-50/30 dark:hover:bg-slate-700/30 transition"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                                {user.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 dark:text-white">{user.full_name}</div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <RoleBadge roleId={user.role_id} />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">
                                        {user.courses?.length > 0 ? user.courses.join(', ') : 'Atanmamış'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge isActive={user.is_active} />
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-sm">
                                        {new Date(user.created_at).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition text-indigo-600 dark:text-indigo-400"
                                                title="Düzenle"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(user.user_id, user.is_active)}
                                                className={`p-2 rounded-lg transition ${user.is_active
                                                    ? 'hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                                    : 'hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400'
                                                    }`}
                                                title={user.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                                            >
                                                {user.is_active ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.user_id, user.full_name)}
                                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600 dark:text-red-400"
                                                title="Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                        <div className="py-20 text-center">
                            <p className="text-gray-400 dark:text-slate-500">Kullanıcı bulunamadı</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && editingUser && (
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
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <UserCog className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Kullanıcı Düzenle</h3>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">İsim</label>
                                    <input
                                        type="text"
                                        value={editingUser.full_name}
                                        readOnly
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-900 rounded-lg text-gray-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">Email</label>
                                    <input
                                        type="email"
                                        value={editingUser.email}
                                        readOnly
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-900 rounded-lg text-gray-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">Rol Değiştir</label>
                                    <select
                                        defaultValue={editingUser.role_id}
                                        onChange={(e) => setEditingUser({ ...editingUser, newRoleId: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="1">Admin</option>
                                        <option value="2">Öğretmen</option>
                                        <option value="3">Öğrenci</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">Ders Atamaları</label>
                                    <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-300 dark:border-slate-600 p-3 bg-gray-50 dark:bg-slate-900 space-y-2">
                                        {courses.length === 0 && (
                                            <p className="text-xs text-gray-500 dark:text-slate-400">Ders bulunamadı</p>
                                        )}
                                        {courses.map((course) => (
                                            <label key={course.course_id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCourseIds.includes(course.course_id)}
                                                    onChange={() => toggleCourseSelection(course.course_id)}
                                                    className="rounded border-gray-300 dark:border-slate-500"
                                                />
                                                <span>{course.course_name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">Yeni Şifre (opsiyonel)</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="En az 6 karakter"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
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
                                    onClick={handleSaveUserChanges}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-indigo-900"
                                >
                                    Kaydet
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
const StatBox = ({ label, value, color }) => (
    <div className={`${color} rounded-xl p-4 text-center`}>
        <div className="text-2xl font-black">{value}</div>
        <div className="text-xs font-bold opacity-80">{label}</div>
    </div>
);

const RoleBadge = ({ roleId }) => {
    const roles = {
        1: { label: 'Admin', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
        2: { label: 'Öğretmen', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
        3: { label: 'Öğrenci', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
    };
    const role = roles[roleId] || roles[3];
    return <span className={`px-3 py-1 rounded-lg text-xs font-bold ${role.class}`}>{role.label}</span>;
};

const StatusBadge = ({ isActive }) => (
    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${isActive
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
        }`}>
        {isActive ? '🟢 Aktif' : '⚫ Pasif'}
    </span>
);

export default UserManagementPage;
