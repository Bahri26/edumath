import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const TeachersPage = () => {
    const navigate = useNavigate();
    const [expandedFaq, setExpandedFaq] = useState(null);

    const features = [
        {
            icon: '📝',
            title: 'Hızlı Sınav Oluşturma',
            description: 'Binlerce sorulardan seçerek dakikalar içinde sınav hazırla. Sorularla uğraş, sınav hazırlama ile değil!',
            details: ['Önceden hazır soru havuzu', 'Konuya göre filtreleme', 'Zorluk seviyesi seçimi', 'Otomatik sınav oluşturma']
        },
        {
            icon: '📊',
            title: 'Detaylı Raporlama & Analiz',
            description: 'Hangi öğrenci hangi konuda zorlanıyor? Sistem detaylı dahîll raporlarla gösteriyor. Müdahale etmek çok kolay!',
            details: ['Konu bazlı analiz', 'Öğrenci karşılaştırması', 'Sınıf ortalaması', 'Gelişim takibi']
        },
        {
            icon: '⚡',
            title: 'Zaman Tasarrufu',
            description: 'Sınav kağıtlarını okumakta saatler harcama! Sistem otomatik olarak öğrenci cevaplarını kontrol eder, puanlar.',
            details: ['Otomatik düzeltme', 'Anlık sonuçlar', 'Vakit tasarrufu', 'İş yükü azaltma']
        },
        {
            icon: '👥',
            title: 'Sınıf Yönetimi',
            description: 'Öğrencileri ekle, sınavları dağıt, progreslerini izle. Hepsi tek konumda, tek ekranda!',
            details: ['Öğrenci ekleme/silme', 'Sınav dağıtma', 'Deadline belirleme', 'Otomatik bildirim']
        },
        {
            icon: '🎯',
            title: 'Performans Takibi',
            description: 'Yazılı içi sınav sonuçları, kaç öğrenci başarılı? Grafikleri indir, okula sunumunu yap!',
            details: ['Gerçek zamanlı istatistik', 'Grafik oluşturma', 'PDF raporlar', 'E-mail gönderimi']
        },
        {
            icon: '🔒',
            title: 'Güvenli & Uyumlu',
            description: 'Tüm öğrenci verileri korunmuştur. MEB müfredatına tamamen uyumlu, resmi raporlama destekler.',
            details: ['Veri güvenliği', 'Şifrelenmiş depolama', 'MEB uyumlu', 'GDPR uyumlu']
        }
    ];

    const benefits = [
        {
            number: '70%',
            label: 'Daha Az Zaman Harcama',
            desc: 'Sınav hazırlama ve düzeltme süresini 70% çalışmayla azalt'
        },
        {
            number: '100%',
            label: 'Doğru Sonuçlar',
            desc: 'Otomatik düzeltme sayesinde hiçbir hata olmaz, tüm sonuçlar doğru'
        },
        {
            number: '5 dk',
            label: 'Rapor Hazırlama',
            desc: 'Saatler değil, 5 dakika içinde detaylı raporlar oluştur'
        }
    ];

    const usecases = [
        {
            title: 'Yazılı Sınav',
            description: 'Yazılı sınav hazırla, öğrencilere dağıt, otomatik düzelt, rapor oluştur',
            icon: '✍️'
        },
        {
            title: 'Müdür Ödev',
            description: 'Ödevler ver, otomatik kontrol et, puanla. Öğrenciler cihazlarda çözüyor',
            icon: '📚'
        },
        {
            title: 'Quiz & Küçük Sınavlar',
            description: 'Derste hızlı quizler yap, öğrenci katılımını ölç, eksikleri tespit et',
            icon: '⚡'
        },
        {
            title: 'Çıkış Sınavı',
            description: 'Ünitenin sonunda konuyu anlayıp anlamadığını hızlı test et',
            icon: '🎯'
        }
    ];

    const testimonials = [
        {
            name: 'Mehmet Hoca',
            title: 'Matematik Öğretmeni',
            school: 'Atatürk Anadolu Lisesi, Ankara',
            text: 'EduMath sayesinde sınavları hazırlama süresi 3 saattan 20 dakikaya düştü. Artık verilerime daha çok odaklanabiliyorum.',
            rating: 5
        },
        {
            name: 'Ayşe Akın',
            title: 'Rehber Öğretmen',
            school: 'Cumhuriyet Ortaokulu, İstanbul',
            text: 'Hangi öğrenci hangi konuda zorlandığını detaylı raporlardan görüyorum. Müdahale çok daha etkili olmuş.',
            rating: 5
        },
        {
            name: 'Fatih Yılmaz',
            title: 'Matematik Bölüm Başkanı',
            school: 'İstanbul Fen Lisesi',
            text: 'Okulumuzun tüm matematik öğretmenlerine EduMath\'ı tavsiye ettim. Verimlilık muazzam arttı.',
            rating: 5
        }
    ];

    const faqs = [
        {
            q: 'Hangi konuları öğretebilirim?',
            a: 'Matematik 5. sınıftan 12. sınıfa kadar tüm konuları kapsar. MEB müfredatına uyumludur. Kimya, Fen Bilimleri gibi dersler yakında eklenecek.'
        },
        {
            q: 'Öğrencileri nasıl eklerim?',
            a: 'Sınıfını oluştur, kod al, öğrencilerine ver. Bir tıkla katılabilirler. Veya manuel olarak e-mail adresleri ile ekle.'
        },
        {
            q: 'Kendi sorularımı ekleyebilir miyim?',
            a: 'Evet! Kendi sorularını ekle ve bunları sınavlarda kullan. Bu sorular sadece sana ve resmi olarak kalacaktır.'
        },
        {
            q: 'Kaç öğrenci yönetebilirim?',
            a: 'Sınırsız! 30 öğrenciniz olsun, 200 olsun sistem çalışmaya devam ediyor. Hepsi aynı anda sınava girebilir.'
        },
        {
            q: 'Öğrenci verileri güvenli mi?',
            a: 'Tüm veriler şifrelenmiş sunucularda saklanır. GDPR ve tüm veri koruması mevzuatına uyumludur. Gizlilik bizim öncelik.'
        },
        {
            q: 'Fiyatı nedir?',
            a: 'EduMath öğretmenler için de tamamen ücretsiz! Herkesin erişebilmesi bizim hedef.'
        }
    ];

    return (
        <div className="bg-gray-50 min-h-screen font-sans overflow-x-hidden">
            {/* Hero */}
            <div className="relative bg-gradient-to-br from-orange-600 via-red-600 to-orange-700 text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto text-center space-y-4 sm:space-y-6">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="text-3xl sm:text-4xl md:text-5xl font-black"
                    >
                        Öğretmenler İçin EduMath 👨‍🏫
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-base sm:text-lg md:text-xl text-orange-100 max-w-2xl mx-auto"
                    >
                        Sınıfınızı dijitalleştirin, öğrenci takibini otomatikleştirin, zaman kazanın. Eğitmen deneyimini dönüştürün!
                    </motion.p>
                    <motion.button
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        onClick={() => navigate('/register')}
                        className="inline-block mt-4 px-8 py-3 bg-white hover:bg-gray-100 text-orange-600 font-bold rounded-xl transition-all"
                    >
                        Öğretmen Hesabı Aç
                    </motion.button>
                </div>
            </div>

            {/* Özellikler */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center text-gray-800 mb-8 sm:mb-12">
                        Öğretmen Araçları
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
                                            <span className="text-orange-600">✓</span> {detail}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Kullanım Alanları */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center text-gray-800 mb-8 sm:mb-12">
                        Nasıl Kullanabilirsin?
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                        {usecases.map((usecase, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border-l-4 border-orange-500"
                            >
                                <div className="text-3xl sm:text-4xl mb-4">{usecase.icon}</div>
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">{usecase.title}</h3>
                                <p className="text-sm sm:text-base text-gray-600">{usecase.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Faydalar */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center text-gray-800 mb-8 sm:mb-12">
                        Zaman & Verimlilik Kazanč
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                        {benefits.map((benefit, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg text-center border-t-4 border-orange-500"
                            >
                                <div className="text-4xl sm:text-5xl md:text-6xl font-black text-orange-600 mb-3">{benefit.number}</div>
                                <div className="font-bold text-gray-800 mb-2 text-sm sm:text-base">{benefit.label}</div>
                                <p className="text-xs sm:text-sm text-gray-600">{benefit.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Öğretmen Perspektifi */}
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-r from-orange-600 to-red-600 text-white">
                <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black">Öğretmen Deneyimleri</h2>
                    <p className="text-base sm:text-lg text-orange-100">
                        Binlerce öğretmen EduMath ile derslerini daha etkili hale getirdi
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mt-8 sm:mt-12">
                    {testimonials.map((testimonial, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/20"
                        >
                            <div className="flex gap-1 mb-4">
                                {[...Array(testimonial.rating)].map((_, j) => (
                                    <span key={j} className="text-lg">⭐</span>
                                ))}
                            </div>
                            <p className="text-sm sm:text-base text-white italic mb-6">"{testimonial.text}"</p>
                            <div className="border-t border-white/20 pt-4">
                                <div className="font-bold text-white text-sm sm:text-base">{testimonial.name}</div>
                                <div className="text-xs sm:text-sm text-orange-200">{testimonial.title}</div>
                                <div className="text-xs text-orange-300">{testimonial.school}</div>
                            </div>
                        </motion.div>
                    ))}
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
                                    <span className={`text-orange-600 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`}>▼</span>
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
            <div className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-r from-orange-600 to-red-600">
                <div className="max-w-4xl mx-auto text-center text-white space-y-4 sm:space-y-6">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black">Hazır mısın Dijitalleşmeye?</h2>
                    <p className="text-base sm:text-lg text-orange-100">
                        Binlerce öğretmen gibi sen de EduMath ile dersleri daha verimli hale getir!
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => navigate('/register')}
                        className="inline-block px-8 sm:px-10 py-3 sm:py-4 bg-white hover:bg-gray-100 text-orange-600 font-bold rounded-xl transition-all"
                    >
                        Şimdi Başla
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default TeachersPage;
