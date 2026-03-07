import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion } from 'framer-motion';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Validasyon
        if (!formData.email || !formData.newPassword || !formData.confirmPassword) {
            setError('Tüm alanları doldurun.');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor!');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Şifre en az 6 karakter olmalıdır.');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/request-password-reset', {
                email: formData.email,
                newPassword: formData.newPassword
            });

            setMessage(response.data.message || 'Şifre değiştirme talebiniz iletildi. Admin onaylayınca yeni şifrenizle giriş yapabilirsiniz.');
            setFormData({ email: '', newPassword: '', confirmPassword: '' });
            
            // 3 saniye sonra login sayfasına yönlendir
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            setError(err.response?.data?.message || 'Talep gönderilemedi. E-posta adresinizi kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-purple-100"
            >
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🔐</div>
                    <h1 className="text-3xl font-black text-gray-800 mb-2">Şifremi Unuttum</h1>
                    <p className="text-gray-500 text-sm">
                        Yeni şifrenizi belirleyin, admin onayından sonra giriş yapabilirsiniz.
                    </p>
                </div>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-4 text-sm"
                    >
                        ⚠️ {error}
                    </motion.div>
                )}

                {message && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-xl mb-4 text-sm"
                    >
                        ✅ {message}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            📧 E-posta Adresiniz
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                            placeholder="ornek@mail.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            🔑 Yeni Şifre
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                            placeholder="En az 6 karakter"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            🔒 Yeni Şifre (Tekrar)
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                            placeholder="Şifrenizi tekrar girin"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
                            loading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-purple-600 hover:bg-purple-700 hover:shadow-xl'
                        }`}
                    >
                        {loading ? '⏳ Gönderiliyor...' : '📤 Talep Gönder'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-purple-600 hover:text-purple-800 font-medium text-sm transition-colors"
                    >
                        ← Giriş sayfasına dön
                    </button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-gray-600">
                    <p className="font-bold text-blue-600 mb-1">💡 Nasıl Çalışır?</p>
                    <ul className="space-y-1 list-disc list-inside">
                        <li>E-postanızı ve yeni şifrenizi girin</li>
                        <li>Talebiniz yöneticiye iletilir</li>
                        <li>Onaylandıktan sonra yeni şifrenizle giriş yapabilirsiniz</li>
                    </ul>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
