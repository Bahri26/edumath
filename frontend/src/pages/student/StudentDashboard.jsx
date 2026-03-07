import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AICompanion from '../../components/student/AICompanion';
import PerformanceChart from '../../components/PerformanceChart';
import api from '../../services/api';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [examOnboarding, setExamOnboarding] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('edumath_user');
        if (!storedUser) {
            navigate('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    // role guard: only students and admins may view this page
    useEffect(() => {
        if (user && !['student', 'admin'].includes(user.role)) {
            navigate('/');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!user) {
            setExamOnboarding(null);
            return;
        }

        let mounted = true;
        (async () => {
            try {
                const res = await api.get('/exams/student-list');
                if (mounted) setExamOnboarding(res.data?.onboarding || null);
            } catch (_) {
                if (mounted) setExamOnboarding(null);
            }
        })();
        return () => { mounted = false; };
    }, [user]);

    if (!user) return null;

    return (
        <div className="font-sans">
            {/* --- İÇERİK (ORTA ALAN) --- */}
            <div className="max-w-6xl mx-auto mt-10 p-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Hoş Geldin, {user.name || user.full_name?.split(' ')[0]} 👋</h1>
                <p className="text-gray-500 mb-8">Eğlenceli matematik dünyasına hazırsın!</p>

                {/* --- AI COMPANION BÖLÜMÜ --- */}
                <AICompanion />

                {/* === BAŞARIYA KIRDİRAN ANALİTİKLER (PerformanceChart) === */}
                <div className="mt-12 mb-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        📊 Karne &amp; Analizlerim
                        <span className="text-sm font-normal text-gray-500 ml-auto">Akıllı Performans Raporun</span>
                    </h2>
                    <PerformanceChart studentId={user.id || user.user_id} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* KART 1: SINAVLAR (Yeni sayfaya gider) */}
                    <div 
                        onClick={() => navigate('/student-exams')} 
                        className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group"
                    >
                        <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                            📝
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Sınavlar</h3>
                        <p className="text-gray-500 text-sm">Aktif sınavlara katıl ve kendini dene.</p>
                        {examOnboarding?.levelTag && !examOnboarding?.isNewStudent && (
                            <div className="mt-3 inline-block text-xs font-bold rounded-full px-3 py-1 bg-indigo-100 text-indigo-700">
                                Seviye: {examOnboarding.levelTag}
                            </div>
                        )}
                        {examOnboarding?.isNewStudent && (
                            <div className={`mt-4 text-xs font-semibold rounded-lg px-3 py-2 ${examOnboarding?.diagnosticAssigned ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                {examOnboarding?.diagnosticAssigned
                                    ? 'Ölçme ve değerlendirme testiniz var.'
                                    : 'Yeni öğrenci: Öğretmeniniz sınav atadığında burada görünecek.'}
                            </div>
                        )}
                    </div>
                    
                    {/* KART 2: BAŞARILARIM (Pasif Görünüm) */}
                    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group opacity-80">
                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                            🏆
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Başarılarım</h3>
                        <p className="text-gray-500 text-sm">Geçmiş sınav sonuçlarını ve rozetlerini incele.</p>
                    </div>

                    {/* KART 3: PROFİLİM (Opsiyonel) */}
                    <div 
                        onClick={() => navigate('/profile')} 
                        className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group"
                    >
                        <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                            👤
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Profilim</h3>
                        <p className="text-gray-500 text-sm">Bilgilerini düzenle ve ayarlarını yap.</p>
                    </div>

                    {/* KART 4: ÖĞRENME YOLU */}
                    <div 
                        onClick={() => navigate('/learning-path')} 
                        className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group"
                    >
                        <div className="w-14 h-14 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                            🗺️
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Öğrenme Yolu</h3>
                        <p className="text-gray-500 text-sm">Sana özel hazırlanan çalışma haritasını keşfet.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
