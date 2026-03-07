import React, { useState, useEffect } from 'react';
import {
  LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';

const PerformanceChart = ({ studentId }) => {
  const [examData, setExamData] = useState([]);
  const [topicData, setTopicData] = useState([]);
  const [timeAnalysis, setTimeAnalysis] = useState(null);
  const [totalExams, setTotalExams] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    fetchAnalytics();
  }, [studentId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const lpRes = await api.get('/learning-path');
      const payload = lpRes?.data?.data || {};

      const recent = Array.isArray(payload.recentActivity) ? payload.recentActivity : [];
      const topics = Array.isArray(payload.topics) ? payload.topics : [];
      const overall = payload.overallStats || {};
      const lastExam = payload.lastExam || null;

      let history = recent
        .slice(0, 5)
        .reverse()
        .map((item, idx) => ({
          name: item?.date
            ? new Date(item.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
            : `S${idx + 1}`,
          puan: Number(item?.avg_score ?? 0)
        }));

      if (!history.length && Number(overall?.totalExams || 0) > 0) {
        history = [{
          name: lastExam?.created_at
            ? new Date(lastExam.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
            : 'Son Sınav',
          puan: Number(lastExam?.score ?? overall?.avgScore ?? 0)
        }];
      }

      let mappedTopics = topics.map((t) => ({
        subject: t.topic || 'Genel',
        A: Number(t.score || 0)
      }));

      if (!mappedTopics.length && Number(overall?.totalExams || 0) > 0) {
        mappedTopics = [{ subject: 'Genel Matematik', A: Number(overall?.successRate || overall?.avgScore || 0) }];
      }

      const derivedTime = Number(overall?.totalExams || 0) > 0
        ? {
          avg_time_seconds: null,
          accuracy_percent: Number(overall?.successRate || 0),
          assessment: Number(overall?.successRate || 0) >= 70
            ? 'Performansın iyi, hızını korurken zor sorulara odaklan.'
            : 'Temel konularda düzenli tekrar ve daha fazla soru çözümü önerilir.'
        }
        : null;

      setExamData(history);
      setTopicData(mappedTopics);
      setTimeAnalysis(derivedTime);
      setTotalExams(Number(overall?.totalExams || history.length || 0));

    } catch (err) {
      console.error('❌ Analytics yükleme hatası:', err);
      setExamData([]);
      setTopicData([]);
      setTimeAnalysis(null);
      setTotalExams(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">📊 Veriler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* === 1. GELİŞİM GRAFİĞİ (Çizgi) === */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition">
        <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
          <span className="text-2xl">📈</span> Başarı Trendi
          <span className="text-xs text-gray-400 font-normal ml-auto">Son 5 Sınav</span>
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {examData.length > 0 ? `${examData[0].name} → ${examData[examData.length - 1].name}` : 'Sınav verisi yok'}
        </p>
        
        {examData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={examData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '10px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    backgroundColor: '#010101',
                    color: '#fff'
                  }}
                  formatter={(value) => `${value} puan`}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type="monotone" 
                  dataKey="puan" 
                  stroke="#6366f1" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} 
                  activeDot={{ r: 8 }}
                  isAnimationActive={true}
                  name="Başarı Puanı"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-400">Henüz sınav verisi bulunmuyor</p>
          </div>
        )}
      </div>

      {/* === 2. KONU ANALİZİ (Radar) === */}
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition">
        <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
          <span className="text-2xl">🕸️</span> Konu Hakimiyeti
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {topicData.length > 0 
            ? `${topicData.length} konuda başarını görüntüle` 
            : 'Konu verisi yok'
          }
        </p>

        {topicData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={topicData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#374151', fontSize: 12, fontWeight: 'bold' }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={false} 
                  axisLine={false}
                />
                <Radar 
                  name="Başarı %" 
                  dataKey="A" 
                  stroke="#8b5cf6" 
                  strokeWidth={2} 
                  fill="#8b5cf6" 
                  fillOpacity={0.4}
                />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb'
                  }}
                  formatter={(value) => `${value}%`}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-400">Konu analizi için yeterli veri yok</p>
          </div>
        )}

        {/* Zayıf Konular Uyarısı */}
        {topicData.some(t => t.A < 50) && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 font-semibold mb-2">⚠️ Dikkat: Zayıf Konular</p>
            <div className="space-y-1">
              {topicData
                .filter(t => t.A < 50)
                .map(t => (
                  <p key={t.subject} className="text-sm text-red-600">
                    • <strong>{t.subject}</strong>: {t.A}% (Çalışmalısın)
                  </p>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* === 3. ZAMAN YÖNETİMİ ANALİZİ === */}
      {timeAnalysis && Object.keys(timeAnalysis).length > 1 && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition">
          <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
            <span className="text-2xl">⏱️</span> Zaman Yönetimi
          </h3>

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {/* Ortalama Soru Süresi */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-blue-600 text-sm font-semibold">Ort. Soru Süresi</p>
              <p className="text-2xl font-bold text-blue-700 mt-2">
                {timeAnalysis.avg_time_seconds ? `${Math.round(timeAnalysis.avg_time_seconds)}s` : 'N/A'}
              </p>
            </div>

            {/* Doğruluk Oranı */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-600 text-sm font-semibold">Doğruluk</p>
              <p className="text-2xl font-bold text-green-700 mt-2">
                {timeAnalysis.accuracy_percent || 0}%
              </p>
            </div>

            {/* Değerlendirme */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-purple-600 text-sm font-semibold">Durum</p>
              <p className="text-sm font-bold text-purple-700 mt-2">
                {timeAnalysis.assessment || 'Bilinmiyor'}
              </p>
            </div>
          </div>

          {/* Tavsiye */}
          {timeAnalysis.assessment && (
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded">
              <p className="text-indigo-800">
                <strong>💡 Tavsiye:</strong> {timeAnalysis.assessment}
              </p>
            </div>
          )}
        </div>
      )}

      {/* === İstatistik Kartları === */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl border border-indigo-200">
          <p className="text-indigo-600 font-semibold text-sm">Toplam Sınav</p>
          <p className="text-4xl font-bold text-indigo-700 mt-2">{totalExams}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200">
          <p className="text-emerald-600 font-semibold text-sm">Ortalama Başarı</p>
          <p className="text-4xl font-bold text-emerald-700 mt-2">
            {examData.length > 0 
              ? Math.round(examData.reduce((sum, d) => sum + d.puan, 0) / examData.length)
              : '-'
            }
            <span className="text-xl">%</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
          <p className="text-orange-600 font-semibold text-sm">En Yüksek</p>
          <p className="text-4xl font-bold text-orange-700 mt-2">
            {examData.length > 0 
              ? Math.max(...examData.map(d => d.puan))
              : '-'
            }
            <span className="text-xl">%</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
