import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';

const LoginPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/auth/login', formData);
            const respData = res?.data?.data;

            // Backend returns { data: { user, token } }
            // Handle both shapes: direct user object OR { user, token }
            let user = null;
            let token = null;
            if (!respData) {
                alert("Giriş başarısız! Kullanıcı verisi alınamadı.");
                return;
            }

            if (respData.user) {
                user = respData.user;
                token = respData.token || null;
            } else {
                user = respData;
                token = respData.token || null;
            }

            // Determine role string: prefer `role`, fall back to numeric `role_id`
            let role = user.role || respData.role || null;
            if (!role && typeof user.role_id !== 'undefined') {
                // Map numeric role ids to names (adjust mapping if your DB differs)
                if (user.role_id === 1) role = 'admin';
                else if (user.role_id === 2) role = 'teacher';
                else role = 'student';
            }

            if (user && role) {
                const saveObj = { user, token, role };
                localStorage.setItem('edumath_user', JSON.stringify(saveObj));

                if (role === 'admin') navigate('/admin-dashboard');
                else if (role === 'teacher') navigate('/teacher-dashboard');
                else navigate('/student-dashboard');

                window.location.reload(); // update navbar
            } else {
                alert("Giriş başarısız! Kullanıcı verisi alınamadı.");
            }
        } catch (error) {
            console.error("Giriş Hatası:", error);
            alert(error.response?.data?.message || "E-posta veya şifre hatalı.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4 font-sans">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-white/50 backdrop-blur-xl"
            >
                <div className="text-center mb-8">
                    <div className="text-5xl mb-2">👋</div>
                    <h1 className="text-3xl font-black text-gray-800">Tekrar Hoş Geldin!</h1>
                    <p className="text-gray-500">Kaldığın yerden devam etmek için giriş yap.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">E-Posta</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="ornek@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Şifre</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-200 flex justify-center items-center"
                    >
                        {loading ? <span className="animate-spin mr-2">⚪</span> : 'Giriş Yap'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button 
                        onClick={() => navigate('/forgot-password')}
                        className="text-purple-600 hover:text-purple-800 font-medium text-sm transition-colors"
                    >
                        🔐 Şifremi Unuttum
                    </button>
                </div>

                <div className="mt-8 text-center pt-6 border-t border-gray-100">
                    <p className="text-gray-600 text-sm">
                        Henüz hesabın yok mu? 
                        <button 
                            onClick={() => navigate('/register')}
                            className="text-indigo-600 font-bold hover:underline ml-1"
                        >
                            Hemen Kayıt Ol
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
