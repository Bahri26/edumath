import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    
    // Exams entry card
    const ExamsCard = () => {
        return (
            <div onClick={() => navigate('/exams')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center text-3xl mb-4">📂</div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Sınavlar</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">Oluşturduğunuz sınavları yönetin ve inceleyin.</p>
                    </div>
                </div>

                <div className="mt-5 flex gap-2">
                    <button
                        onClick={(ev) => { ev.stopPropagation(); navigate('/exams'); }}
                        className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                        Sınavları Yönet
                    </button>
                    <button
                        onClick={(ev) => { ev.stopPropagation(); navigate('/create-exam'); }}
                        className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 dark:text-slate-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                        Yeni Sınav
                    </button>
                </div>
            </div>
        );
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('edumath_user');
        if (!storedUser) {
            navigate('/login');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    // role guard: only teachers and admins may view this page
    useEffect(() => {
        if (user && !['teacher', 'admin'].includes(user.role)) {
            navigate('/');
        }
    }, [user, navigate]);

    if (!user) return null;

    return (
        <div className="font-sans">
            
            {/* --- PANEL İÇERİĞİ (KARTLAR) --- */}
            <div className="max-w-7xl mx-auto mt-10 p-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Hoş Geldiniz, Hocam 👋</h1>
                <p className="text-gray-500 dark:text-slate-400 mb-8">Bugün ne yapmak istersiniz?</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* Exams card: shows recent exams + actions */}
                    <ExamsCard />

                    {/* 3. SORU BANKASI (GÜNCELLENDİ) */}
                    <div onClick={() => navigate('/question-bank')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group">
                        <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">📚</div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Soru Bankası</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">Soruları listele, düzenle ve sil.</p>
                    </div>

                    {/* 4. ANKETLER */}
                    <div onClick={() => navigate('/surveys')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group">
                        <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">📊</div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Anketler</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">Geri bildirimleri incele.</p>
                    </div>

                    {/* 5. ÖĞRENCİ ANALİZİ */}
                    <div onClick={() => navigate('/teacher-analysis')} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group">
                        <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">📈</div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Öğrenci Analizi</h3>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">Sınıf başarısını ve öğrenci detaylarını incele.</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
