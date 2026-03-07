import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const StudentsPage = () => {
    const navigate = useNavigate();
    const [expandedFaq, setExpandedFaq] = useState(null);

    const features = [
        {
            icon: '🎮',
            title: 'Oyunlaştırılmış Öğrenme',
            description: 'Her soruyu çöztüğünde puan kazan, rozetler odakla ve liderlik tablosunda yukarı çık. Öğrenme hiçbir zaman bu kadar eğlenceli olmamıştı!',
            details: ['Puan sistemi', 'Başarı rozetleri', 'Lig ve turnuvalar', 'Günlük görevler']
        },
        {
            icon: '🤖',
            title: 'AI Destekli Kişisel Koçluk',
            description: 'Yapay zeka algoritması senin zayıf yönlerini tespit eder ve ona göre özel soru soru seçer. Hiç kimse aynı sınava girmez!',
            details: ['Akıllı soru önerimi', 'Zayıf alanları tespit', 'Güçlü yönleri vurgula', 'Kişisel ilerleme planı']
        },
        {
            icon: '📊',
            title: 'Detaylı Performans Analizi',
            description: 'Hangi konularda başarılı, hangilerinde zorlanıyorsun? Eğer anlayın grafikler sayesinde tüm bilgiler net ortada.',
            details: ['Sistem grafikleri', 'Konuya göre analiz', 'Zaman takibi', 'Karşılaştırmalı raporlar']
        },
        {
            icon: '⚡',
            title: 'Hızlı Sınav Çözümü',
            description: 'Binlerce sorudan oluşan havuzdan senin seviyen uygun sınavlar çöz. Her sınav farklı, her sınav öğretici.',
            details: ['Sınıf seviyesine göre soru', 'Zaman ölçümü', 'Anlık geri dönüş', 'Hata analizi']
        },
        {
            icon: '📱',
            title: 'Her Yerden Erişim',
            description: 'Otobüste, evde, bahçede... Telefon, tablet veya bilgisayardan dilediğin zaman, dilediğin yerden öğren.',
            details: ['Tüm cihazlarda senkron', 'Çevrimdışı mod', 'Hızlı yükleme', 'Düşük veri kullanımı']
        },
        {
            icon: '🏆',
            title: 'Liderlik Tablosu & Yarışmalar',
            description: 'Arkadaşlarınla yarış, okulunun en iyi öğrencisi olmaya çalış. Sağlıklı rekabet motivasyon artırır!',
            details: ['Günlük liderlik', 'Haftalık sıralama', 'Okulunuz arası yarış', 'Özel turnuvalar']
        }
    ];

    const benefits = [
        {
            number: '85%',
            label: 'Matematik başarısında artış',
            desc: 'EduMath kullanan öğrenciler ortalama 85% daha iyi sınav sonuçları alıyor'
        },
        {
            number: '10x',
            label: 'Daha Hızlı Öğrenme',
            desc: 'Yapay zeka sayesinde eksiklerini 10 kat daha hızlı bulup düzeltiyorsun'
        },
        {
            number: '24/7',
            label: 'Her Zaman Ulaşılabilir',
            desc: 'Gece gündüz, tatil kumanda sız EduMath senin yanında'
        }
    ];

    const testimonials = [
        {
            name: 'Ayşe Yılmaz',
            grade: '9. Sınıf',
            school: 'Atatürk Anadolu Lisesi',
            text: '40 puandan 85\'e çıktım! Bilmediğim konuları EduMath hemen tespit etti ve özel soru seçti.',
            score: 5
        },
        {
            name: 'Berke Şahin',
            grade: '11. Sınıf',
            school: 'İstanbul Fen Lisesi',
            text: 'YKS\'ye hazırlanırken en iyi yardımcım oldu. Her gün 30 soru çözüyorum, puanım haftalık 5-6 puan artıyor.',
            score: 5
        },
        {
            name: 'Zeynep Kaya',
            grade: '8. Sınıf',
            school: 'Cumhuriyet Ortaokulu',
            text: 'Matematik dersi korkulu rüya değil artık. Eğlenerek öğreniyorum ve puanım 55\'ten 92\'ye çıktı.',
            score: 5
        }
    ];

    const faqs = [
        {
            q: 'Gerçekten ücretsiz mi?',
            a: 'Evet! EduMath tamamen ücretsiz. Binlerce soruya, sınırsız sınava ve yapay zeka analizine ücretsiz erişmen var.'
        },
        {
            q: 'Hangi sınıflara uygun?',
            a: 'EduMath 5. sınıftan 12. sınıfa kadar (ortaokul ve lise) tüm seviyelerine uygundur. MEB müfredatına tamamen uyumlu.'
        },
        {
            q: 'Özel yardım alabilir miyim?',
            a: 'Evet! Soruları çözemezsen, sistem şaşırtacak soruları tespit eder ve kolay seviyede soru sunarak yardım eder.'
        },
        {
            q: 'Öğretmenim takip edebilir mi?',
            a: 'Evet! Öğretmenin seni sisteme ekleyebilir ve senin ilerlemeni detaylı raporlarla takip edebilir.'
        },
        {
            q: 'Kaç soru var?',
            a: 'Şu anda 5000+ soru var ve her gün yeni sorular eklenerek sayı artmaya devam ediyor.'
        }
    ];

    return (
        <div className="bg-gray-50 min-h-screen font-sans overflow-x-hidden">
            {/* Hero */}
            <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto text-center space-y-4 sm:space-y-6">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl md:text-5xl font-black"
                    >
                        Öğrenciler İçin EduMath 🎓
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-base sm:text-lg md:text-xl text-blue-100 max-w-2xl mx-auto"
                    >
                        Matematiği sevmek, başarı elde etmek ve sınavlarda yükselişe geçmek için ihtiyacın olan her şey burada.
                    </motion.p>
                    <motion.button
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        onClick={() => navigate('/register')}
                        className="inline-block mt-4 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all"
                    >
                        Hemen Başla
                    </motion.button>
                </div>
            </div>

            {/* Özellikler */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center text-gray-800 mb-8 sm:mb-12">
                        Neden EduMath Seç?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all"
                            >
                                <div className="text-4xl sm:text-5xl mb-4">{feature.icon}</div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                                <p className="text-sm sm:text-base text-gray-600 mb-4">{feature.description}</p>
                                <ul className="space-y-2">
                                    {feature.details.map((detail, j) => (
                                        <li key={j} className="text-xs sm:text-sm text-gray-500 flex items-center gap-2">
                                            <span className="text-indigo-600">✓</span> {detail}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Faydalar */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-r from-indigo-50 to-blue-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center text-gray-800 mb-8 sm:mb-12">
                        İstatistiklerimiz Konuşuyor
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                        {benefits.map((benefit, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg text-center"
                            >
                                <div className="text-4xl sm:text-5xl md:text-6xl font-black text-indigo-600 mb-3">{benefit.number}</div>
                                <div className="font-bold text-gray-800 mb-2 text-sm sm:text-base">{benefit.label}</div>
                                <p className="text-xs sm:text-sm text-gray-600">{benefit.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Başarı Hikayeleri */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center text-gray-800 mb-8 sm:mb-12">
                        Başarı Hikayeleri
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                        {testimonials.map((testimonial, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-100"
                            >
                                <div className="flex gap-1 mb-4">
                                    {[...Array(testimonial.score)].map((_, j) => (
                                        <span key={j} className="text-lg">⭐</span>
                                    ))}
                                </div>
                                <p className="text-sm sm:text-base text-gray-700 italic mb-4">"{testimonial.text}"</p>
                                <div className="border-t pt-4">
                                    <div className="font-bold text-gray-800 text-sm sm:text-base">{testimonial.name}</div>
                                    <div className="text-xs sm:text-sm text-gray-500">{testimonial.grade} • {testimonial.school}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SSS */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gray-100">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center text-gray-800 mb-8 sm:mb-12">
                        Sıkça Sorulan Sorular
                    </h2>
                    <div className="space-y-3 sm:space-y-4">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                                    className="w-full p-4 sm:p-5 text-left flex justify-between items-center hover:bg-gray-50 transition-all"
                                >
                                    <span className="font-bold text-sm sm:text-base text-gray-800">{faq.q}</span>
                                    <span className={`text-indigo-600 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`}>▼</span>
                                </button>
                                {expandedFaq === i && (
                                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t text-sm sm:text-base text-gray-600">
                                        {faq.a}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="max-w-4xl mx-auto text-center text-white space-y-4 sm:space-y-6">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black">Hazır mısın?</h2>
                    <p className="text-base sm:text-lg text-blue-100">
                        Binlerce öğrenci gibi sen de EduMath ile matematik başarısını artır!
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigate('/register')}
                        className="inline-block px-8 sm:px-10 py-3 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-all"
                    >
                        Şimdi Kayıt Ol
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default StudentsPage;
