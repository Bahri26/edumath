import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const SurveyDistributionChart = lazy(() => import('../../components/charts/SurveyDistributionChart'));

const SurveyStatsPage = () => {
    const { surveyId } = useParams();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get(`/surveys/stats/${surveyId}`);
                setStats(res.data.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [surveyId]);

    if (loading) return <div className="p-20 text-center">Veriler yükleniyor...</div>;
    if (!stats) return <div className="p-20 text-center">Veri bulunamadı.</div>;

    // Grafik Verisini Hazırla
    const chartData = stats.distribution.map(d => ({
        name: `${d.rating} Yıldız`,
        value: d.count
    }));

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

    return (
        <div className="min-h-screen bg-gray-50 p-10 font-sans">
            <div className="max-w-5xl mx-auto">
                <button onClick={() => navigate('/surveys')} className="mb-6 text-gray-500 hover:text-indigo-600">← Anketlere Dön</button>
                
                {/* BAŞLIK KARTI */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">{stats.survey.title}</h1>
                        <p className="text-gray-500 mt-1">Anket Analiz Raporu</p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black text-indigo-600">{stats.totalResponses}</div>
                        <div className="text-sm text-gray-400">Toplam Katılım</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* --- GRAFİK ALANI --- */}
                    <Suspense fallback={<div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 text-center text-gray-400">Grafik yükleniyor...</div>}>
                        <SurveyDistributionChart chartData={chartData} colors={COLORS} />
                    </Suspense>

                    {/* --- DETAYLI LİSTE --- */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-700 mb-6">Detaylı Döküm</h3>
                        <div className="space-y-4">
                            {stats.distribution.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800">{item.rating} Yıldız</span>
                                        <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full" 
                                                style={{ 
                                                    width: `${(item.count / stats.totalResponses) * 100}%`,
                                                    backgroundColor: COLORS[index % COLORS.length]
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                    <span className="font-bold text-indigo-600">{item.count} Kişi</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-8 bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="text-blue-800 font-bold text-sm mb-1">💡 Yapay Zeka Önerisi</h4>
                            <p className="text-blue-600 text-xs">
                                Katılımcıların %{(stats.distribution[0]?.count / stats.totalResponses * 100).toFixed(0)}'i olumlu görüş bildirdi. 
                                Ancak düşük puan verenlerin yorumlarını incelemeniz önerilir.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SurveyStatsPage;
