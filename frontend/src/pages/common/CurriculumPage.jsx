import { useState } from 'react';
import { motion } from 'framer-motion';

const CurriculumPage = () => {
    const [expandedGrade, setExpandedGrade] = useState(5);

    const grades = [
        {
            grade: 5,
            title: '5. Sınıf',
            topics: ['Doğal Sayılar', 'Kesirler', 'Ondalık Kesirler', 'İşlemler', 'Ölçme', 'Geometri']
        },
        {
            grade: 6,
            title: '6. Sınıf',
            topics: ['Bölünebilirlik', 'Kesirler İşlemleri', 'Ondalıklar', 'Oran Orantı', 'Yüzdeler', 'Cebir Temelleri']
        },
        {
            grade: 7,
            title: '7. Sınıf',
            topics: ['Tam Sayılar', 'Rasyonel Sayılar', 'Cebirsel İfadeler', 'Eşitlikler', 'Geometrik Şekiller', 'Dönüşümler']
        },
        {
            grade: 8,
            title: '8. Sınıf',
            topics: ['Üsler & Karekök', 'Köklü Sayılar', 'Birinci Dereceden Denklemler', 'Koordinat Sistemi', 'Sistem', 'Üçgenler']
        },
        {
            grade: 9,
            title: '9. Sınıf',
            topics: ['Mantık', 'Kümeler', 'Gerçek Sayılar', 'Denklemler & Eşitsizlikler', 'Lineer Fonksiyonlar', 'Trigonometri']
        },
        {
            grade: 10,
            title: '10. Sınıf',
            topics: ['Polinomlar', 'İkinci Dereceden Denklemler', 'Fonksiyonlar', 'Üstel-Logaritmik', 'Trigonometri İleri', 'Permütasyon-Kombinasyon']
        },
        {
            grade: 11,
            title: '11. Sınıf',
            topics: ['Diziler', 'Seritik Fonksiyonlar', 'Türev', 'İntegral Başlangıç', 'Limit', 'Süreklilik']
        },
        {
            grade: 12,
            title: '12. Sınıf (YKS)',
            topics: ['Denklem Sistemleri', 'Çarpanlara Ayırma', 'Oran Orantı', 'Dönem içeriği', 'Trigonometri YKS', 'Analitik Geometri']
        }
    ];

    const features = [
        {
            icon: '📚',
            title: 'MEB Müfredatı ile Uyumlu',
            description: 'EduMath tüm konuları Milli Eğitim Bakanlığı\'nın güncel müfredatına göre hazırlar.'
        },
        {
            icon: '👨‍🎓',
            title: 'Tüm Sınıf Seviyeleri',
            description: 'Ortaokul 5. sınıftan lise 12. sınıfa kadar tüm seviyeleri kapsamaktadır.'
        },
        {
            icon: '🎓',
            title: 'YKS Hazırlığı',
            description: 'YKS mat test hazırlığı için özel konular ve pratik sınavları bulunur.'
        },
        {
            icon: '📝',
            title: '5000+ Soru',
            description: 'Tüm konuları kapsayan binlerce soru her gün yeni sorular eklenerek artıyor.'
        },
        {
            icon: '🔄',
            title: 'Düzenli Güncelleme',
            description: 'Müfredat değişikliklerine göre sınav ve sorular anında güncellenir.'
        },
        {
            icon: '📊',
            title: 'Sınıf Başına Soru',
            description: 'Her sınıfın gereken konuları başında, orta ve ileri seviyelerde sunulur.'
        }
    ];

    const examTypes = [
        {
            title: 'Yazılı Sınavı',
            description: 'Dönem yazılıları için hazırlanan sınavlar (20-30 soru)',
            color: 'from-blue-500 to-indigo-600'
        },
        {
            title: 'Ünite Sınavı',
            description: 'Her ünitenin sonunda konuyu test etme sınavları (10-15 soru)',
            color: 'from-green-500 to-teal-600'
        },
        {
            title: 'Dünya uyum Sınavı',
            description: 'Daha önceden sorulan sınavlarla karşılaştırma (20-25 soru)',
            color: 'from-orange-500 to-red-600'
        },
        {
            title: 'Yoğun Tekrar',
            description: 'Tüm konuların karışık sorularla hazırlanmış sınavlar (30-40 soru)',
            color: 'from-purple-500 to-pink-600'
        }
    ];

    return (
        <div className="bg-gray-50 min-h-screen font-sans overflow-x-hidden">
            {/* Hero */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto text-center space-y-4 sm:space-y-6">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl md:text-5xl font-black"
                    >
                        EduMath Müfredat 📚
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-base sm:text-lg md:text-xl text-indigo-100 max-w-2xl mx-auto"
                    >
                        MEB müfredatına tamamen uyumlu, her sınıf seviyesi için kapsamlı konu ve binlerce soru.
                    </motion.p>
                </div>
            </div>

            {/* Özellikler */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center text-gray-800 mb-8 sm:mb-12">
                        Müfredat Özellikleri
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 text-center"
                            >
                                <div className="text-4xl sm:text-5xl mb-4">{feature.icon}</div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                                <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sınıf Seviyeleri */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center text-gray-800 mb-8 sm:mb-12">
                        5. - 12. Sınıf Müfredat
                    </h2>
                    <div className="space-y-3 sm:space-y-4">
                        {grades.map((gradeItem, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                            >
                                <button
                                    onClick={() => setExpandedGrade(expandedGrade === gradeItem.grade ? null : gradeItem.grade)}
                                    className="w-full p-4 sm:p-6 flex justify-between items-center hover:bg-gray-50 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                            <span className="text-white font-black text-lg sm:text-2xl">{gradeItem.grade}</span>
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-lg sm:text-xl font-bold text-gray-800">{gradeItem.title}</h3>
                                            <p className="text-xs sm:text-sm text-gray-500">{gradeItem.topics.length} konu</p>
                                        </div>
                                    </div>
                                    <span className={`text-indigo-600 transition-transform text-xl sm:text-2xl ${expandedGrade === gradeItem.grade ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>
                                {expandedGrade === gradeItem.grade && (
                                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-200 bg-gray-50">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {gradeItem.topics.map((topic, j) => (
                                                <div key={j} className="bg-white p-3 sm:p-4 rounded-lg border border-indigo-200 flex items-center gap-2">
                                                    <span className="text-indigo-600">📌</span>
                                                    <span className="text-sm sm:text-base font-medium text-gray-700">{topic}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sınav Türleri */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center text-gray-800 mb-8 sm:mb-12">
                        Sınav Türleri
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                        {examTypes.map((examType, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`bg-gradient-to-br ${examType.color} text-white p-6 sm:p-8 rounded-2xl shadow-lg`}
                            >
                                <h3 className="text-xl sm:text-2xl font-bold mb-3">{examType.title}</h3>
                                <p className="text-sm sm:text-base text-white/90">{examType.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Soru Dağılımı */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center text-gray-800 mb-8 sm:mb-12">
                        Soru İstatistikleri
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                        {[
                            { label: 'Toplam Soru', number: '5000+', icon: '📝' },
                            { label: 'Konular', number: '150+', icon: '📚' },
                            { label: 'Sınavlar', number: '1000+', icon: '✅' }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 sm:p-8 rounded-2xl shadow-lg text-center"
                            >
                                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{stat.icon}</div>
                                <div className="text-3xl sm:text-4xl md:text-5xl font-black mb-2">{stat.number}</div>
                                <div className="text-sm sm:text-base text-indigo-100">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Zorluk Seviyeleri */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gray-100">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center text-gray-800 mb-8 sm:mb-12">
                        Zorluk Seviyeleri
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                        {[
                            {
                                level: 'Kolay ⭐',
                                desc: 'Temeller ve basit uygulamalar',
                                color: 'border-green-500 bg-green-50'
                            },
                            {
                                level: 'Orta ⭐⭐',
                                desc: 'Karmaşık problemler ve sentez',
                                color: 'border-yellow-500 bg-yellow-50'
                            },
                            {
                                level: 'Zor ⭐⭐⭐',
                                desc: 'İleri seviye ve analiz konuları',
                                color: 'border-red-500 bg-red-50'
                            }
                        ].map((level, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className={`p-6 sm:p-8 rounded-2xl border-l-4 ${level.color}`}
                            >
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">{level.level}</h3>
                                <p className="text-sm sm:text-base text-gray-700">{level.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Yakında */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black">Yakında Eklenecekler 🚀</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
                        {['Kimya Müfredat', 'Fizik Müfredat', 'Biyoloji Müfredat', 'Türkçe Müfredat'].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                className="bg-white/10 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-white/20"
                            >
                                <p className="text-base sm:text-lg font-bold">{item}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CurriculumPage;
