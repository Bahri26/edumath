import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const roleLabel = (role) => {
    if (role === 'admin') return 'Yönetici Hesabı';
    if (role === 'teacher') return 'Öğretmen Hesabı';
    return 'Öğrenci Hesabı';
};

const roleBadgeClass = (role) => {
    if (role === 'admin') return 'bg-red-100 text-red-700';
    if (role === 'teacher') return 'bg-purple-100 text-purple-700';
    return 'bg-blue-100 text-blue-700';
};

const normalizeRole = (candidateRole, roleId) => {
    if (candidateRole) return candidateRole;
    if (Number(roleId) === 1) return 'admin';
    if (Number(roleId) === 2) return 'teacher';
    return 'student';
};

const normalizeUserFromStorage = (parsed) => {
    const core = parsed?.user ? parsed.user : parsed;
    if (!core) return null;

    const normalizedRole = normalizeRole(parsed?.role || core?.role, core?.role_id);
    return {
        ...core,
        role: normalizedRole,
        full_name: core.full_name || core.name || '',
        email: core.email || '',
        subject: core.subject || core.department || core.specialty || '',
        lesson_or_course: core.lesson_or_course || core.lesson_name || core.course_name || '',
    };
};

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ full_name: '', email: '', subject: '' });
    const [loading, setLoading] = useState(false);
    const [studentLevel, setStudentLevel] = useState(null);
    const [isNewStudent, setIsNewStudent] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('edumath_user');
        if (!storedUser) {
            navigate('/login');
            return;
        }

        let parsed = null;
        try {
            parsed = JSON.parse(storedUser);
        } catch (e) {
            parsed = null;
        }

        const normalized = normalizeUserFromStorage(parsed);
        if (!normalized) {
            navigate('/login');
            return;
        }

        setUser(normalized);
        setFormData({
            full_name: normalized.full_name,
            email: normalized.email,
            subject: normalized.subject || ''
        });

        // Backend'den güncel profil bilgilerini çek (best-effort)
        api.get('/users/me', { headers: { 'x-no-auth-redirect': '1' } })
            .then((res) => {
                const backendUser = res?.data?.data;
                if (!backendUser) return;

                const refreshed = {
                    ...normalized,
                    ...backendUser,
                    role: normalizeRole(normalized.role || backendUser.role, backendUser.role_id),
                    subject: backendUser.subject || backendUser.department || backendUser.specialty || normalized.subject || '',
                    lesson_or_course: backendUser.lesson_or_course || backendUser.lesson_name || backendUser.course_name || normalized.lesson_or_course || ''
                };

                setUser(refreshed);
                setFormData({
                    full_name: refreshed.full_name || refreshed.name || '',
                    email: refreshed.email || '',
                    subject: refreshed.subject || ''
                });

                // localStorage yapısını bozmadan user alanını güncelle
                const authObj = parsed?.user ? parsed : { user: parsed, token: parsed?.token, role: parsed?.role };
                const nextAuth = {
                    ...authObj,
                    user: refreshed,
                    role: normalizeRole(authObj?.role || refreshed.role, refreshed.role_id)
                };
                localStorage.setItem('edumath_user', JSON.stringify(nextAuth));
            })
            .catch(() => null);

        api.get('/exams/student-list', { headers: { 'x-no-auth-redirect': '1' } })
            .then((res) => {
                const onboarding = res?.data?.onboarding;
                if (!onboarding) return;
                setStudentLevel(onboarding.levelTag || null);
                setIsNewStudent(Boolean(onboarding.isNewStudent));
            })
            .catch(() => null);
    }, [navigate]);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const res = await api.put('/users/me', formData);
            const updatedUser = {
                ...user,
                ...res.data.data,
                full_name: res.data.data.full_name || formData.full_name,
                email: res.data.data.email || formData.email,
                subject: res.data.data.subject || formData.subject,
                role: user.role,
            };

            const raw = localStorage.getItem('edumath_user');
            const parsed = raw ? JSON.parse(raw) : null;
            const authObj = parsed?.user ? parsed : { user: parsed, token: parsed?.token, role: parsed?.role };
            const nextAuth = {
                ...authObj,
                user: updatedUser,
                role: user.role
            };

            localStorage.setItem('edumath_user', JSON.stringify(nextAuth));
            setUser(updatedUser);
            setIsEditing(false);
            alert('✅ Profil güncellendi!');
        } catch (error) {
            // /users/me endpointi yoksa en azından local state güncelle
            if (error?.response?.status === 404 || error?.response?.status === 405) {
                const updatedUser = {
                    ...user,
                    full_name: formData.full_name,
                    email: formData.email,
                    subject: formData.subject,
                };

                const raw = localStorage.getItem('edumath_user');
                const parsed = raw ? JSON.parse(raw) : null;
                const authObj = parsed?.user ? parsed : { user: parsed, token: parsed?.token, role: parsed?.role };
                localStorage.setItem('edumath_user', JSON.stringify({ ...authObj, user: updatedUser, role: user.role }));
                setUser(updatedUser);
                setIsEditing(false);
                alert('✅ Profil yerelde güncellendi.');
            } else {
                alert('Hata: ' + (error.response?.data?.message || 'Güncellenemedi.'));
            }
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="font-sans min-h-screen bg-gray-50 p-6 flex justify-center">
            <div className="w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">👤 Profilim</h1>

                <div className="bg-white p-8 rounded-3xl shadow-xl border border-white/50">
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                        <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-5xl font-bold shadow-lg ring-4 ring-indigo-50">
                            {(user.full_name || user.name || 'U').charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 text-center md:text-left w-full">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Ad Soyad"
                                    />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="E-Posta"
                                    />
                                    {user.role !== 'student' && (
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Branş (Örn: Matematik)"
                                        />
                                    )}
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-3xl font-bold text-gray-800 mb-1">{user.full_name || user.name}</h2>
                                    <p className="text-gray-500 text-lg">{user.email}</p>
                                    <span className={`mt-3 inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${roleBadgeClass(user.role)}`}>
                                        {roleLabel(user.role)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Rol</p>
                                <p className="text-sm font-semibold text-gray-800">{roleLabel(user.role)}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{user.role === 'student' ? 'Ders' : 'Branş'}</p>
                                <p className="text-sm font-semibold text-gray-800">{user.role === 'student' ? (user.lesson_or_course || user.subject || 'Belirtilmedi') : (user.subject || 'Belirtilmedi')}</p>
                            </div>
                        </div>

                        {user.role === 'student' && (
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Öğrenci Seviyesi</p>
                                <p className="text-sm font-semibold text-indigo-900">
                                    {isNewStudent ? 'Yeni Öğrenci' : (studentLevel || 'Henüz belirlenmedi')}
                                </p>
                            </div>
                        )}

                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                            <span className="text-sm font-bold text-gray-500 uppercase">Kayıt Tarihi</span>
                            <span className="font-mono text-gray-700">
                                {new Date(user.created_at || Date.now()).toLocaleDateString('tr-TR')}
                            </span>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                            <p className="text-sm font-bold text-indigo-700 mb-2">📌 Profilde Olması Faydalı Bilgiler</p>
                            <ul className="list-disc ml-5 text-sm text-indigo-900 space-y-1">
                                <li>Okul / kurum bilgisi</li>
                                <li>Sınıf seviyesi veya öğretim kademesi</li>
                                <li>Telefon ve alternatif iletişim</li>
                                <li>Son giriş tarihi ve güvenlik oturum bilgisi</li>
                                <li>Hedefler, ilgi alanları ve öğrenme tercihleri</li>
                            </ul>
                        </div>

                        {isEditing ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                >
                                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
                            >
                                Bilgileri Düzenle
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
