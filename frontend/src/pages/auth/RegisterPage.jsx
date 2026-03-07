import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'student' // Varsayılan öğrenci
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post('/auth/register', formData);
            alert("🎉 " + (res.data.message || 'Kayıt başarılı'));
            // if backend returned user/token, save to storage and navigate
            const respUser = res?.data?.user || res?.data?.data || null;
            if (respUser) localStorage.setItem('edumath_user', JSON.stringify(respUser));
            navigate('/login');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Kayıt başarısız.");
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
                    <div className="text-5xl mb-2">🚀</div>
                    <h1 className="text-3xl font-black text-gray-800">Aramıza Katıl</h1>
                    <p className="text-gray-500">Matematik serüvenine başlamak için bilgileri doldur.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Ad Soyad</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="Örn: Ali Yılmaz"
                            required
                        />
                    </div>

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

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Hesap Türü</label>
                        <div className="relative">
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                            >
                                <option value="student">👨‍🎓 Öğrenci</option>
                                <option value="teacher">👩‍🏫 Öğretmen</option>
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500">▼</div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-200 flex justify-center items-center"
                    >
                        {loading ? <span className="animate-spin mr-2">⚪</span> : 'Kayıt Ol'}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-gray-100">
                    <p className="text-gray-600 text-sm">
                        Zaten hesabın var mı? 
                        <button 
                            onClick={() => navigate('/login')}
                            className="text-indigo-600 font-bold hover:underline ml-1"
                        >
                            Giriş Yap
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
