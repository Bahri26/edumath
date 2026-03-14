import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Target, Award, Activity, Brain, X } from 'lucide-react';
import api from '../../services/api';

const TeacherStudentCharts = lazy(() => import('../../components/charts/TeacherStudentCharts'));

const TeacherAnalysisPage = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assessmentsLoading, setAssessmentsLoading] = useState(true);
    
    // Modal State
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentDetails, setStudentDetails] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [savingAssessment, setSavingAssessment] = useState(false);
    const [assessmentForm, setAssessmentForm] = useState({
        assessment_id: null,
        level_tag: 'A1',
        confidence_score: 0,
        weak_topics: [],
        recommended_actions: [],
        analysis_text: '',
        notes: ''
    });

    useEffect(() => {
        fetchClassStats();
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            setAssessmentsLoading(true);
            const res = await api.get('/reports/student-assessments?limit=100');
            setAssessments(res.data?.rows || []);
        } catch (error) {
            console.error('Değerlendirme listesi hatası', error);
        } finally {
            setAssessmentsLoading(false);
        }
    };

    const fetchClassStats = async () => {
        try {
            const res = await api.get('/reports/class-stats');
            setStudents(res.data.data);
        } catch (error) {
            console.error("Rapor hatası", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStudentClick = async (student) => {
        setSelectedStudent(student);
        setDetailLoading(true);
        try {
            const [detailRes, assessmentRes] = await Promise.all([
                api.get(`/reports/student-detailed/${student.user_id}`),
                api.get(`/reports/student-assessments?studentId=${student.user_id}&limit=1`)
            ]);

            const detailData = detailRes.data.data;
            setStudentDetails(detailData);

            const latestAssessment = (assessmentRes.data?.rows || [])[0] || detailData?.latestAssessment || null;
            if (latestAssessment) {
                setAssessmentForm({
                    assessment_id: latestAssessment.assessment_id || null,
                    level_tag: latestAssessment.level_tag || 'A1',
                    confidence_score: Number(latestAssessment.confidence_score || 0),
                    weak_topics: Array.isArray(latestAssessment.weak_topics) ? latestAssessment.weak_topics : [],
                    recommended_actions: Array.isArray(latestAssessment.recommended_actions) ? latestAssessment.recommended_actions : [],
                    analysis_text: latestAssessment.analysis_text || '',
                    notes: latestAssessment.notes || ''
                });
            } else {
                const avg = Number(detailData?.stats?.avgScore || 0);
                const defaultLevel = avg >= 80 ? 'C2' : avg >= 65 ? 'C1' : avg >= 50 ? 'B2' : avg >= 35 ? 'B1' : avg >= 20 ? 'A2' : 'A1';
                setAssessmentForm({
                    assessment_id: null,
                    level_tag: defaultLevel,
                    confidence_score: avg,
                    weak_topics: (detailData?.topics || []).filter((t) => t.score < 60).map((t) => t.name).slice(0, 5),
                    recommended_actions: [],
                    analysis_text: '',
                    notes: ''
                });
            }
        } catch (error) {
            console.error('❌ Öğrenci detay hatası:', error);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!selectedStudent?.user_id) return;
        setAiLoading(true);
        try {
            const res = await api.post('/reports/student-ai-analysis', {
                studentId: selectedStudent.user_id
            });
            const payload = res.data?.data || {};
            setAssessmentForm((prev) => ({
                ...prev,
                level_tag: payload.studentLevel || prev.level_tag,
                confidence_score: Number(payload.confidenceScore ?? prev.confidence_score ?? 0),
                weak_topics: Array.isArray(payload.weakTopics) ? payload.weakTopics : prev.weak_topics,
                recommended_actions: Array.isArray(payload.recommendedActions) ? payload.recommendedActions : prev.recommended_actions,
                analysis_text: payload.topicNarrative || prev.analysis_text
            }));
        } catch (error) {
            alert('AI analiz alınamadı: ' + (error.response?.data?.error || 'Hata'));
        } finally {
            setAiLoading(false);
        }
    };

    const handleSaveAssessment = async () => {
        if (!selectedStudent?.user_id) return;
        setSavingAssessment(true);
        try {
            const payload = {
                user_id: selectedStudent.user_id,
                level_tag: assessmentForm.level_tag,
                confidence_score: Number(assessmentForm.confidence_score || 0),
                weak_topics: assessmentForm.weak_topics,
                recommended_actions: assessmentForm.recommended_actions,
                analysis_text: assessmentForm.analysis_text,
                notes: assessmentForm.notes
            };

            let res;
            if (assessmentForm.assessment_id) {
                res = await api.put(`/reports/student-assessments/${assessmentForm.assessment_id}`, payload);
            } else {
                res = await api.post('/reports/student-assessments', payload);
            }

            const saved = res.data?.data;
            setAssessmentForm((prev) => ({
                ...prev,
                assessment_id: saved?.assessment_id || prev.assessment_id
            }));
            await fetchAssessments();
            alert('✅ Öğrenci değerlendirmesi kaydedildi.');
        } catch (error) {
            alert('❌ Kaydetme başarısız: ' + (error.response?.data?.error || 'Hata'));
        } finally {
            setSavingAssessment(false);
        }
    };

    const handleDeleteAssessment = async () => {
        if (!assessmentForm.assessment_id) return;
        if (!window.confirm('Bu değerlendirme kaydı silinsin mi?')) return;
        try {
            await api.delete(`/reports/student-assessments/${assessmentForm.assessment_id}`);
            setAssessmentForm((prev) => ({
                ...prev,
                assessment_id: null,
                analysis_text: '',
                notes: '',
                recommended_actions: []
            }));
            await fetchAssessments();
            alert('✅ Değerlendirme silindi.');
        } catch (error) {
            alert('❌ Silme başarısız: ' + (error.response?.data?.error || 'Hata'));
        }
    };

    const handleOpenAssessment = async (assessment) => {
        const targetStudent = students.find((s) => Number(s.user_id) === Number(assessment.user_id));
        if (!targetStudent) {
            alert('Öğrenci bilgisi bulunamadı.');
            return;
        }
        await handleStudentClick(targetStudent);
    };

    const handleExportAssessments = async () => {
        try {
            const res = await api.get('/reports/student-assessments-export?format=csv', {
                responseType: 'blob'
            });
            const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `teacher_assessments_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert('CSV dışa aktarma başarısız: ' + (error.response?.data?.error || 'Hata'));
        }
    };

    const handleExportAssessmentsPdf = () => {
        try {
            const rows = assessments || [];
            const now = new Date();
            const stamp = now.toLocaleString('tr-TR');

            const esc = (value) => String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            const bodyRows = rows.map((item) => `
                <tr>
                    <td>${esc(item.full_name)}</td>
                    <td>${esc(item.email)}</td>
                    <td>${esc(item.level_tag || '-')}</td>
                    <td>${esc(item.confidence_score ?? '-')}</td>
                    <td>${esc((item.weak_topics || []).join(', ') || '-')}</td>
                    <td>${esc(item.updated_at ? new Date(item.updated_at).toLocaleDateString('tr-TR') : '-')}</td>
                </tr>
            `).join('');

            const html = `
                <!doctype html>
                <html>
                <head>
                    <meta charset="utf-8" />
                    <title>Ogretmen Degerlendirme Raporu</title>
                    <style>
                        body { font-family: Segoe UI, Arial, sans-serif; margin: 24px; color: #111827; }
                        h1 { margin: 0 0 8px; font-size: 22px; }
                        p.meta { margin: 0 0 18px; color: #6b7280; font-size: 12px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 12px; text-align: left; vertical-align: top; }
                        th { background: #f9fafb; font-weight: 700; }
                        .empty { color: #6b7280; font-size: 13px; margin-top: 16px; }
                        @page { size: A4; margin: 12mm; }
                    </style>
                </head>
                <body>
                    <h1>Ogretmen Ogrenci Degerlendirme Raporu</h1>
                    <p class="meta">Olusturma: ${esc(stamp)} | Kayit sayisi: ${rows.length}</p>
                    ${rows.length ? `<table>
                        <thead>
                            <tr>
                                <th>Ogrenci</th>
                                <th>E-posta</th>
                                <th>Seviye</th>
                                <th>Guven Skoru</th>
                                <th>Zayif Konular</th>
                                <th>Guncelleme</th>
                            </tr>
                        </thead>
                        <tbody>${bodyRows}</tbody>
                    </table>` : '<div class="empty">Degerlendirme kaydi bulunamadi.</div>'}
                </body>
                </html>
            `;

            const printWindow = window.open('', '_blank', 'width=1100,height=800');
            if (!printWindow) {
                alert('PDF penceresi acilamadi. Tarayici popup engeline takilmis olabilir.');
                return;
            }
            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 250);
        } catch (error) {
            alert('PDF dışa aktarma başarısız: ' + (error?.message || 'Hata'));
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Henüz yok";
        return new Date(dateString).toLocaleDateString('tr-TR');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-10 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">📊 Sınıf Performans Raporu</h1>
                        <p className="text-gray-500">Öğrencilerin genel durumunu inceleyin.</p>
                    </div>
                    <button onClick={() => navigate('/teacher-dashboard')} className="text-gray-500 hover:text-gray-900">
                        ← Panele Dön
                    </button>
                </div>

                {/* --- KAYITLI DEĞERLENDİRMELER --- */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-xl font-black text-gray-800">🧠 Kayıtlı Öğrenci Değerlendirmeleri</h2>
                            <p className="text-xs text-gray-500 mt-1">AI + öğretmen notlarıyla oluşturulan seviyelendirme kayıtları</p>
                        </div>
                        <button
                            onClick={handleExportAssessments}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm"
                        >
                            CSV Dışa Aktar
                        </button>
                        <button
                            onClick={handleExportAssessmentsPdf}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm"
                        >
                            PDF Olarak İndir
                        </button>
                    </div>
                    {assessmentsLoading ? (
                        <div className="p-6 text-gray-400">Yükleniyor...</div>
                    ) : assessments.length === 0 ? (
                        <div className="p-6 text-gray-400">Henüz değerlendirme kaydı yok.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="p-4 text-left">Öğrenci</th>
                                        <th className="p-4 text-left">Seviye</th>
                                        <th className="p-4 text-left">Güven</th>
                                        <th className="p-4 text-left">Zayıf Konular</th>
                                        <th className="p-4 text-left">Güncelleme</th>
                                        <th className="p-4 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assessments.map((item) => (
                                        <tr key={item.assessment_id} className="border-t border-gray-100">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800">{item.full_name}</div>
                                                <div className="text-xs text-gray-500">{item.email}</div>
                                            </td>
                                            <td className="p-4 font-bold text-indigo-700">{item.level_tag || '-'}</td>
                                            <td className="p-4">{item.confidence_score ?? '-'}</td>
                                            <td className="p-4 text-gray-600 max-w-[280px] truncate">{(item.weak_topics || []).join(', ') || '-'}</td>
                                            <td className="p-4 text-gray-500">{item.updated_at ? new Date(item.updated_at).toLocaleDateString('tr-TR') : '-'}</td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleOpenAssessment(item)}
                                                    className="text-indigo-600 hover:underline font-bold"
                                                >
                                                    Aç
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* --- ÖĞRENCİ TABLOSU --- */}
                {loading ? (
                    <div className="text-center py-20 text-gray-400">Veriler yükleniyor...</div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 font-bold text-sm uppercase tracking-wider">
                                <tr>
                                    <th className="p-6">Öğrenci Adı</th>
                                    <th className="p-6">E-Posta</th>
                                    <th className="p-6 text-center">Çözülen Sınav</th>
                                    <th className="p-6 text-center">Ortalama Puan</th>
                                    <th className="p-6 text-right">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.map((student) => (
                                    <tr key={student.user_id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="p-6 font-bold text-gray-800">{student.full_name}</td>
                                        <td className="p-6 text-gray-500">{student.email}</td>
                                        <td className="p-6 text-center">
                                            <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-xs font-bold">
                                                {student.total_exams}
                                            </span>
                                        </td>
                                        <td className="p-6 text-center font-bold text-lg">
                                            <span className={student.avg_score >= 50 ? 'text-green-600' : 'text-red-500'}>
                                                {Math.round(student.avg_score)}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button 
                                                onClick={() => handleStudentClick(student)}
                                                className="text-indigo-600 font-bold hover:underline text-sm"
                                            >
                                                Detay Gör →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {students.length === 0 && (
                            <div className="p-10 text-center text-gray-400">Henüz kayıtlı öğrenci yok.</div>
                        )}
                    </div>
                )}
            </div>

            {/* --- DETAY MODALI (Gelişmiş Dashboard) --- */}
            <AnimatePresence>
                {selectedStudent && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedStudent(null)}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header (Profil Kartı) */}
                            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
                                
                                <div className="relative flex justify-between items-start">
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl font-black border-4 border-white/30 shadow-xl">
                                            {studentDetails?.profile?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-black mb-2">{studentDetails?.profile?.full_name || 'Yükleniyor...'}</h2>
                                            <p className="text-white/80 text-sm mb-3">{studentDetails?.profile?.email}</p>
                                            <div className="flex gap-2">
                                                <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold border border-white/30">
                                                    Öğrenci
                                                </span>
                                                <span className="bg-green-500/30 backdrop-blur-sm text-green-100 px-4 py-1.5 rounded-full text-xs font-bold border border-green-400/30">
                                                    ✓ Aktif
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedStudent(null)} 
                                        className="bg-white/10 backdrop-blur-sm hover:bg-white/20 p-3 rounded-xl transition-all hover:rotate-90 duration-300"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* İçerik */}
                            {detailLoading ? (
                                <div className="p-20 text-center">
                                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 mx-auto"></div>
                                    <p className="text-gray-400 mt-4">Veriler yükleniyor...</p>
                                </div>
                            ) : (
                                <div className="p-8 space-y-8">
                                    
                                    {/* 1. Özet Kartlar (Stats Grid) */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <StatCard 
                                            icon={<Target size={28} />}
                                            label="Ortalama Puan" 
                                            value={studentDetails?.stats?.avgScore || 0}
                                            suffix="Puan"
                                            color="indigo"
                                        />
                                        <StatCard 
                                            icon={<Activity size={28} />}
                                            label="Toplam Sınav" 
                                            value={studentDetails?.stats?.totalExams || 0}
                                            suffix="Test"
                                            color="purple"
                                        />
                                        <StatCard 
                                            icon={<Award size={28} />}
                                            label="Doğru Cevap" 
                                            value={studentDetails?.stats?.totalCorrect || 0}
                                            suffix="Soru"
                                            color="green"
                                        />
                                        <StatCard 
                                            icon={<TrendingUp size={28} />}
                                            label="Başarı Oranı" 
                                            value={studentDetails?.stats?.successRate || 0}
                                            suffix="%"
                                            color="orange"
                                        />
                                    </div>

                                    <Suspense fallback={<div className="rounded-3xl border border-gray-100 bg-gray-50 p-8 text-center text-gray-400">Grafikler yükleniyor...</div>}>
                                        <TeacherStudentCharts
                                            history={studentDetails?.history || []}
                                            topics={studentDetails?.topics || []}
                                        />
                                    </Suspense>

                                    {/* 4. Son Aktiviteler */}
                                    <div className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-100 rounded-3xl p-6 shadow-lg">
                                        <h3 className="font-black text-gray-800 mb-6 flex items-center gap-3 text-lg">
                                            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white">
                                                📝
                                            </div>
                                            Son Aktiviteler
                                        </h3>
                                        <div className="space-y-3">
                                            {studentDetails?.recentActivity?.length > 0 ? (
                                                studentDetails.recentActivity.map((activity, index) => (
                                                    <motion.div 
                                                        key={index}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.1 }}
                                                        className="bg-white border-2 border-purple-100 p-4 rounded-2xl flex justify-between items-center hover:shadow-lg transition-all hover:border-purple-300"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="font-bold text-gray-800">{activity.examName}</div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                {activity.correctAnswers}/{activity.totalQuestions} doğru • {activity.successRate}% başarı
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-xs text-gray-400 font-semibold">{activity.date}</span>
                                                            <span className={`px-4 py-2 rounded-xl font-bold text-lg ${
                                                                activity.score >= 70 ? 'bg-green-100 text-green-700' :
                                                                activity.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                                {activity.score}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="text-center py-10 text-gray-400">
                                                    <div className="text-4xl mb-2">📭</div>
                                                    Henüz aktivite yok
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 5. AI Koç Tavsiyesi */}
                                    <div className="bg-gradient-to-r from-orange-50 via-orange-100 to-yellow-50 border-2 border-orange-200 p-6 rounded-3xl flex gap-5 items-start shadow-lg">
                                        <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
                                            <Brain className="text-white" size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-orange-900 mb-2 text-lg flex items-center gap-2">
                                                🤖 AI Koç Tavsiyesi
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="text-xs font-bold text-orange-900 block mb-1">Seviye</label>
                                                        <select
                                                            value={assessmentForm.level_tag}
                                                            onChange={(e) => setAssessmentForm((prev) => ({ ...prev, level_tag: e.target.value }))}
                                                            className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
                                                        >
                                                            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                                                                <option key={level} value={level}>{level}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-orange-900 block mb-1">Güven Skoru</label>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={assessmentForm.confidence_score}
                                                            onChange={(e) => setAssessmentForm((prev) => ({ ...prev, confidence_score: e.target.value }))}
                                                            className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
                                                        />
                                                    </div>
                                                    <div className="flex items-end">
                                                        <button
                                                            onClick={handleGenerateAI}
                                                            disabled={aiLoading}
                                                            className="w-full rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-2 text-sm"
                                                        >
                                                            {aiLoading ? 'AI analiz...' : 'AI Analiz Üret'}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-orange-900 block mb-1">Zayıf Konular (virgülle)</label>
                                                    <input
                                                        type="text"
                                                        value={(assessmentForm.weak_topics || []).join(', ')}
                                                        onChange={(e) => setAssessmentForm((prev) => ({
                                                            ...prev,
                                                            weak_topics: String(e.target.value || '').split(',').map((x) => x.trim()).filter(Boolean)
                                                        }))}
                                                        className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-orange-900 block mb-1">Önerilen Aksiyonlar (satır satır)</label>
                                                    <textarea
                                                        rows={3}
                                                        value={(assessmentForm.recommended_actions || []).join('\n')}
                                                        onChange={(e) => setAssessmentForm((prev) => ({
                                                            ...prev,
                                                            recommended_actions: String(e.target.value || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean)
                                                        }))}
                                                        className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-orange-900 block mb-1">AI Analiz Metni</label>
                                                    <textarea
                                                        rows={3}
                                                        value={assessmentForm.analysis_text || ''}
                                                        onChange={(e) => setAssessmentForm((prev) => ({ ...prev, analysis_text: e.target.value }))}
                                                        className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-xs font-bold text-orange-900 block mb-1">Öğretmen Notu</label>
                                                    <textarea
                                                        rows={2}
                                                        value={assessmentForm.notes || ''}
                                                        onChange={(e) => setAssessmentForm((prev) => ({ ...prev, notes: e.target.value }))}
                                                        className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm"
                                                    />
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleSaveAssessment}
                                                        disabled={savingAssessment}
                                                        className="rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 text-sm"
                                                    >
                                                        {savingAssessment ? 'Kaydediliyor...' : 'Kaydet / Güncelle'}
                                                    </button>
                                                    {assessmentForm.assessment_id && (
                                                        <button
                                                            onClick={handleDeleteAssessment}
                                                            className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 text-sm"
                                                        >
                                                            Kaydı Sil
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Yardımcı Bileşen: Stat Card
const StatCard = ({ icon, label, value, suffix, color }) => {
    const colorClasses = {
        indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700',
        purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
        green: 'from-green-50 to-green-100 border-green-200 text-green-700',
        orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-700',
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border-2 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all cursor-default transform hover:scale-105`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    {icon}
                </div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</p>
            </div>
            <div className="flex items-baseline gap-2">
                <div className="text-4xl font-black">{value}</div>
                <span className="text-lg font-semibold opacity-60">{suffix}</span>
            </div>
        </div>
    );
};

export default TeacherAnalysisPage;
