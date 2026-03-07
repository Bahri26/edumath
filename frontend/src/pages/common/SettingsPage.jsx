import React, { useState } from 'react';
import api from '../../services/api';

const SettingsPage = () => {
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/users/change-password', passwords);
            alert('✅ ' + res.data.message);
            setShowPasswordModal(false);
            setPasswords({ currentPassword: '', newPassword: '' });
        } catch (error) {
            alert('❌ ' + (error.response?.data?.message || 'Hata oluştu.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-sans min-h-screen bg-gray-50 p-6 flex justify-center">
            <div className="w-full max-w-2xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">⚙️ Ayarlar</h1>

                <div className="bg-white rounded-3xl shadow-xl border border-white/50 overflow-hidden">
                    <div
                        onClick={() => setNotifications(!notifications)}
                        className="p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl">🔔</div>
                            <span className="font-bold text-gray-700">Bildirimler</span>
                        </div>
                        <div className={`w-14 h-8 rounded-full relative transition-colors ${notifications ? 'bg-green-500' : 'bg-gray-300'}`}>
                            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 shadow-md transition-all ${notifications ? 'right-1' : 'left-1'}`}></div>
                        </div>
                    </div>

                    <div
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer flex justify-between items-center"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl">🌙</div>
                            <span className="font-bold text-gray-700">Karanlık Mod</span>
                        </div>
                        <div className={`w-14 h-8 rounded-full relative transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 shadow-md transition-all ${darkMode ? 'right-1' : 'left-1'}`}></div>
                        </div>
                    </div>

                    <div
                        onClick={() => setShowPasswordModal(true)}
                        className="p-6 hover:bg-red-50 transition-colors cursor-pointer flex justify-between items-center group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl">🔒</div>
                            <span className="font-bold text-gray-700 group-hover:text-red-600 transition-colors">Şifre Değiştir</span>
                        </div>
                        <span className="text-gray-400 group-hover:text-red-500">Düzenle →</span>
                    </div>
                </div>
            </div>

            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-fade-in-up">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Şifre Yenileme</h2>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">Mevcut Şifre</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={passwords.currentPassword}
                                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">Yeni Şifre</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                                >
                                    {loading ? '...' : 'Güncelle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
