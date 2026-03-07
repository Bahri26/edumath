import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

const AICompanion = () => {
    const [aiData, setAiData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
            const enableAI = import.meta.env.VITE_ENABLE_AI === 'true';
            if (!enableAI) {
                setLoading(false);
                return;
            }

            const fetchAI = async () => {
                try {
                    const res = await api.get('/ai/companion');
                    setAiData(res.data.data);
                } catch (error) {
                    console.error("AI yüklenemedi", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchAI();
    }, []);

    // Yükleniyor Animasyonu
    if (loading) {
        return (
            <div className="w-full h-64 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl flex flex-col items-center justify-center animate-pulse border-2 border-dashed border-indigo-200">
                <div className="text-5xl mb-3">🤖</div>
                <p className="text-indigo-500 font-bold text-lg">EduBot verilerini analiz ediyor...</p>
                <div className="mt-3 flex gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-1 shadow-2xl my-8 relative overflow-hidden"
        >
            {/* Arkaplan Efektleri */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="absolute top-5 left-10 text-4xl animate-pulse">✨</div>
                <div className="absolute top-1/3 right-20 text-3xl animate-pulse" style={{animationDelay: '0.3s'}}>🚀</div>
                <div className="absolute bottom-10 left-1/4 text-3xl animate-pulse" style={{animationDelay: '0.6s'}}>💡</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-[20px] p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 relative z-10">
                
                {/* --- 1. AVATAR (Animasyonlu Robot) --- */}
                <motion.div 
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-32 h-32 md:w-40 md:h-40 shrink-0"
                >
                    {/* Robot Görseli */}
                    <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-orange-300 rounded-2xl flex items-center justify-center text-6xl shadow-2xl border-4 border-white/40 relative group">
                        <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            🤖
                        </motion.span>
                        
                        {/* Gözler Yanıp Sönen Efekt */}
                        <motion.div
                            className="absolute top-2 left-3 w-2 h-2 bg-white rounded-full"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        ></motion.div>
                        <motion.div
                            className="absolute top-2 right-3 w-2 h-2 bg-white rounded-full"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                        ></motion.div>
                    </div>
                    
                    {/* Gölge Efekti */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-24 h-3 bg-black/20 blur-md rounded-full"></div>
                </motion.div>

                {/* --- 2. KONUŞMA BALONU --- */}
                <div className="flex-1">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, x: -30 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="bg-white rounded-3xl rounded-tl-none p-6 md:p-8 shadow-2xl relative"
                    >
                        {/* Balon Oku */}
                        <div className="absolute top-3 -left-4 w-0 h-0 border-t-[20px] border-t-white border-l-[20px] border-l-transparent"></div>

                        {/* Başlık */}
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl md:text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                                ✨ EduBot
                                <motion.span 
                                    className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full font-bold"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    🟢 Çevrimiçi
                                </motion.span>
                            </h3>
                        </div>

                        {/* Mesaj */}
                        <motion.p 
                            className="text-gray-700 text-base md:text-lg leading-relaxed mb-6 font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            {aiData?.message}
                        </motion.p>

                        {/* Buton ve Açıklama */}
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-300 hover:shadow-indigo-500 transition-all flex items-center gap-2 whitespace-nowrap"
                            >
                                🚀 {aiData?.action_text}
                            </motion.button>
                            <motion.span 
                                className="text-xs text-gray-500 font-medium italic"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                            >
                                ✓ Sana özel hazırlandı
                            </motion.span>
                        </div>

                        {/* Motivasyon Kartı */}
                        <motion.div 
                            className="mt-6 pt-6 border-t-2 border-gray-100"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <p className="text-sm text-indigo-600 font-bold flex items-center gap-2">
                                <span>💪</span>
                                Her gün biraz daha iyi ol. Sen bunu yapabilirsin!
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default AICompanion;
