import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { motion } from 'framer-motion';

const ApprovalsPage = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [passwordRequests, setPasswordRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [usersRes, passRes] = await Promise.all([
                api.get('/admin/pending-registrations'),
                api.get('/admin/password-requests')
            ]);
            setPendingUsers(usersRes.data.data || []);
            setPasswordRequests(passRes.data.data || []);
        } catch (error) {
            console.error("Veri hatası", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Kayıt Onaylama
    const handleApproveUser = async (userId) => {
        if (!window.confirm("Bu kullanıcıyı onaylıyor musun?")) return;
        try {
            await api.post('/admin/approve-registration', { userId });
            alert('✅ Kullanıcı hesabı onaylandı!');
            fetchData(); // Listeyi yenile
        } catch (error) {
            alert('❌ Onaylama başarısız: ' + (error.response?.data?.message || 'Hata'));
        }
    };

    // Kayıt Reddetme (Kullanıcıyı silme)
    const handleRejectUser = async (userId) => {
        if (!window.confirm("Bu kullanıcının kaydını reddetmek istediğine emin misin? Kullanıcı silinecek!")) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            alert('✅ Kullanıcı kaydı reddedildi ve silindi.');
            fetchData();
        } catch (error) {
            alert('❌ Silme başarısız: ' + (error.response?.data?.message || 'Hata'));
        }
    };

    // Şifre Onaylama
    const handleApprovePassword = async (requestId) => {
        if (!window.confirm("Kullanıcının şifresi değişecek. Onaylıyor musun?")) return;
        try {
            await api.post('/admin/approve-password', { requestId });
            alert('✅ Kullanıcının şifresi güncellendi!');
            fetchData();
        } catch (error) {
            alert('❌ Onaylama başarısız: ' + (error.response?.data?.message || 'Hata'));
        }
    };

    if (loading) return (
        <div className="p-10 text-center">
            <div className="text-6xl animate-bounce mb-4">⏳</div>
            <p className="text-gray-600 font-medium">Onay Merkezi Yükleniyor...</p>
        </div>
    );

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-black text-gray-800 mb-8 flex items-center gap-3">
                🛡️ Onay Merkezi
                <span className="text-sm font-normal text-gray-500">
                    (Bekleyen: {pendingUsers.length} kayıt, {passwordRequests.length} şifre talebi)
                </span>
            </h1>

            <div className="grid lg:grid-cols-2 gap-8">
                
                {/* --- SOL: YENİ KAYIT ONAYLARI --- */}
                <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
                    <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                        <h3 className="font-bold text-lg">👤 Bekleyen Kayıtlar</h3>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-mono">{pendingUsers.length}</span>
                    </div>
                    
                    <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                        {pendingUsers.length === 0 ? (
                            <p className="text-gray-400 text-center py-10">✅ Bekleyen kayıt yok.</p>
                        ) : (
                            pendingUsers.map(user => (
                                <motion.div 
                                    initial={{opacity: 0, y: 10}} 
                                    animate={{opacity: 1, y: 0}} 
                                    key={user.user_id} 
                                    className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-blue-50 transition-colors"
                                >
                                    <div>
                                        <p className="font-bold text-gray-800">{user.full_name}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded ${
                                                user.role_id === 2 ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'
                                            }`}>
                                                {user.role}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(user.created_at).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleApproveUser(user.user_id)} 
                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-green-200 shadow-lg transition-all"
                                        >
                                            ✓ Onayla
                                        </button>
                                        <button 
                                            onClick={() => handleRejectUser(user.user_id)}
                                            className="bg-red-100 text-red-500 hover:bg-red-200 px-3 py-2 rounded-lg text-sm font-bold transition-colors"
                                        >
                                            ✕ Reddet
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* --- SAĞ: ŞİFRE SIFIRLAMA ONAYLARI --- */}
                <div className="bg-white rounded-2xl shadow-xl border border-orange-100 overflow-hidden">
                    <div className="bg-orange-500 p-4 text-white flex justify-between items-center">
                        <h3 className="font-bold text-lg">🔑 Şifre Talepleri</h3>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-mono">{passwordRequests.length}</span>
                    </div>
                    
                    <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                        {passwordRequests.length === 0 ? (
                            <p className="text-gray-400 text-center py-10">✅ Bekleyen şifre talebi yok.</p>
                        ) : (
                            passwordRequests.map(req => (
                                <motion.div 
                                    initial={{opacity: 0, y: 10}} 
                                    animate={{opacity: 1, y: 0}} 
                                    key={req.request_id} 
                                    className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-orange-50 transition-colors"
                                >
                                    <div>
                                        <p className="font-bold text-gray-800">{req.full_name}</p>
                                        <p className="text-sm text-gray-500">{req.email}</p>
                                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                            <span>🔒</span> Yeni şifre belirlemek istiyor
                                        </p>
                                        <span className="text-xs text-gray-400">
                                            {new Date(req.created_at).toLocaleDateString('tr-TR')} {new Date(req.created_at).toLocaleTimeString('tr-TR')}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => handleApprovePassword(req.request_id)} 
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-orange-200 shadow-lg transition-all"
                                    >
                                        ✓ Değiştir
                                    </button>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ApprovalsPage;
