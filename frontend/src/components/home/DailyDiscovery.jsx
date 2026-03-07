import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import DOMPurify from 'dompurify';

const DailyDiscovery = () => {
    const [fact, setFact] = useState(null);
    const [loading, setLoading] = useState(true);

    const defaultImage = 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1400&q=80';

    useEffect(() => {
        const fetchFact = async () => {
            try {
                const res = await api.get('/ai-content/ai-content', { params: { topic: 'Matematik' } });
                setFact({
                  title: res.data.title || 'Matematik',
                  content: res.data.explanation,
                  did_you_know: res.data.explanation,
                                    image_url: res.data.image_url || defaultImage,
                  category: 'Matematik',
                  color: 'from-yellow-400 to-orange-500'
                });
            } catch (error) {
                console.error("Bilgi çekilemedi", error);
                                setFact({
                                    title: 'Matematik',
                                    content: 'Matematik, desenleri anlamamiza yardimci olan evrensel bir dildir.',
                                    did_you_know: 'Fibonacci dizisi dogadaki bircok oruntude gorulur.',
                                    image_url: defaultImage,
                                    category: 'Matematik',
                                    color: 'from-yellow-400 to-orange-500'
                                });
            } finally {
                setLoading(false);
            }
        };
        fetchFact();
    }, []);

    if (loading || !fact) return null;

    return (
        <div className="py-12 md:py-20 px-6">
            <div className="max-w-6xl mx-auto">
                
                {/* Başlık Alanı */}
                <div className="flex items-center gap-3 mb-8 md:mb-12">
                    <motion.span 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-4xl md:text-5xl"
                    >
                        💡
                    </motion.span>
                    <h2 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">Günün Matematik Keşfi</h2>
                </div>

                {/* --- ANA KART --- */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700 group"
                >
                    {/* Üst Gradient Çizgisi */}
                    <div className={`absolute top-0 left-0 w-full h-2 md:h-3 bg-gradient-to-r ${fact.color}`}></div>

                    <div className="grid grid-cols-1 md:grid-cols-2">
                        
                        {/* SOL: GÖRSEL ALANI */}
                        <div className="relative h-64 md:h-full overflow-hidden min-h-96">
                            <img 
                                src={fact.image_url} 
                                alt={fact.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                loading="lazy"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = defaultImage;
                                }}
                            />
                            {/* Resim Üzeri Kategori Rozeti */}
                            <div className="absolute top-4 left-4">
                                <motion.span 
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    className="px-4 py-2 bg-white/95 dark:bg-slate-900/85 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-100 shadow-lg"
                                >
                                    {fact.category}
                                </motion.span>
                            </div>
                        </div>

                        {/* SAĞ: İÇERİK ALANI */}
                        <div className="p-6 md:p-10 lg:p-12 flex flex-col justify-center bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900">
                            
                            <motion.h3 
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2 }}
                                className={`text-2xl md:text-3xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r ${fact.color}`}
                            >
                                {fact.title}
                            </motion.h3>
                            
                            <motion.div 
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 }}
                                className="text-gray-600 dark:text-gray-200 md:text-lg leading-relaxed mb-8 prose max-w-none"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fact.content || fact.title || '') }}
                            />

                            {/* "Biliyor muydunuz?" Kutusu */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 }}
                                className="bg-indigo-50 dark:bg-slate-700 border-l-4 border-indigo-500 p-4 md:p-6 rounded-r-xl"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl flex-shrink-0">🤔</div>
                                    <div>
                                        <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm md:text-base mb-2">Biliyor muydunuz?</h4>
                                        <p className="text-indigo-700 dark:text-indigo-100 text-sm md:text-base italic">
                                            "{fact.did_you_know}"
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default DailyDiscovery;
