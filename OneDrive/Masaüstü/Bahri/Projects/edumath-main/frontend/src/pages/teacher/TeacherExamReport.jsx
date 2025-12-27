import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { BarChart2, Users, FileText, ArrowLeft } from 'lucide-react';

export default function TeacherExamReport() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      try {
        const res = await apiClient.get(`/exams/${examId}/report`);
        setReport(res.data);
      } catch (err) {
        setError('Rapor verisi alınamadı.');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [examId]);

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!report) return null;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-fade-in">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600"><ArrowLeft size={18}/> Geri</button>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Sınav Raporu</h2>
        <p className="text-slate-500 mb-2 flex items-center justify-center gap-2"><Users size={18}/> Katılımcı: <span className="font-bold text-indigo-600">{report.totalStudents}</span></p>
        <p className="text-slate-500 mb-2 flex items-center justify-center gap-2"><FileText size={18}/> Ortalama Puan: <span className="font-bold text-green-600">{report.avgScore}</span></p>
        <p className="text-slate-500 mb-2">En Yüksek: <span className="font-bold text-emerald-600">{report.maxScore}</span> | En Düşük: <span className="font-bold text-rose-500">{report.minScore}</span></p>
      </div>

      {/* Konu Bazlı Başarı */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl mb-8">
        <h3 className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2 mb-4"><BarChart2 size={18}/> Konu Bazlı Başarı</h3>
        <ul className="space-y-2">
          {report.topicStats && report.topicStats.length > 0 ? report.topicStats.map((topic, i) => (
            <li key={i} className="flex justify-between items-center">
              <span className="font-medium text-slate-700 dark:text-slate-200">{topic.name}</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-300">%{topic.successRate}</span>
            </li>
          )) : <li className="text-slate-400">Konu analizi yok.</li>}
        </ul>
      </div>

      {/* Öğrenci Listesi */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 mb-8">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Öğrenci Sonuçları</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700">
                <th className="p-2 text-left">Ad Soyad</th>
                <th className="p-2 text-left">Puan</th>
                <th className="p-2 text-left">Doğru</th>
                <th className="p-2 text-left">Yanlış</th>
                <th className="p-2 text-left">Boş</th>
              </tr>
            </thead>
            <tbody>
              {report.students && report.students.length > 0 ? report.students.map((s, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                  <td className="p-2 font-medium text-slate-700 dark:text-slate-200">{s.name}</td>
                  <td className="p-2 font-bold text-green-600">{s.score}</td>
                  <td className="p-2 text-emerald-600">{s.correctCount}</td>
                  <td className="p-2 text-rose-500">{s.wrongCount}</td>
                  <td className="p-2 text-slate-400">{s.blankCount}</td>
                </tr>
              )) : <tr><td colSpan={5} className="text-center text-slate-400 py-4">Öğrenci sonucu yok.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
