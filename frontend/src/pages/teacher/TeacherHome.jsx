import React, { useEffect, useState } from 'react';
import { Plus, Bell } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import ActivityRow from '../../components/ui/ActivityRow';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/api';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';

const TeacherHome = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/teacher/stats');
        setStats(res.data || {});
      } catch (err) {
        setStats({});
      } finally {
        setLoading(false);
      }
    };
    const loadStudents = async () => {
      try {
        const res = await apiClient.get('/teacher/students');
        setStudents(Array.isArray(res.data?.students) ? res.data.students : []);
      } catch (err) {
        setStudents([]);
      }
    };
    loadStats();
    loadStudents();
  }, []);

  // Mock aktiviteler (API entegrasyonu daha sonra)
  const recentActivities = [
    { id: 1, name: 'Ahmet Yılmaz', action: 'Sınav tamamladı', score: 85, time: '10 dk önce' },
    { id: 2, name: 'Ayşe Kaya', action: 'Ödev teslim etti', score: 92, time: '1 saat önce' },
    { id: 3, name: 'Can Demir', action: 'Anket cevapladı', score: 0, time: '2 saat önce' },
  ];
  return (
    <div className="animate-fade-in space-y-6">
      {/* Başlık Alanı */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Hoşgeldiniz, Hocam! 👋</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {stats ? `${(stats.totalStudents ?? 0)} öğrenciniz var, Sınıf ortalaması: ${(stats.classAverage ?? 0)}` : 'Verileri yükleniyor...'}
          </p>
        </div>
        <Button 
          variant="primary" 
          size="md" 
          icon={Plus}
          onClick={() => showToast('Yeni sınav oluşturma özelliği yakında!', 'info')}
        >
          Yeni Sınav Oluştur
        </Button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">Yükleniyor...</div>
        ) : stats ? (
          <>
            {/* Öğrenciler */}
            <Card className="p-6">
              <h3 className="font-bold text-sm text-slate-600 dark:text-slate-300 mb-3 uppercase tracking-wider">Öğrenciler</h3>
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="Toplam Öğrenci" value={stats.totalStudents ?? 0} icon={Plus} color="bg-blue-600" />
                <StatCard title="Sınıf Ortalaması" value={`${(stats.classAverage ?? 0)}%`} icon={Plus} color="bg-indigo-600" />
              </div>
            </Card>

            {/* Sorular */}
            <Card className="p-6">
              <h3 className="font-bold text-sm text-slate-600 dark:text-slate-300 mb-3 uppercase tracking-wider">Sorular</h3>
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="Soru Bankası" value={stats.totalQuestions ?? 0} icon={Plus} color="bg-purple-600" />
                <StatCard title="Bugün Soru" value={stats.todayQuestions ?? 0} icon={Plus} color="bg-emerald-600" />
              </div>
            </Card>

            {/* Anketler */}
            <Card className="p-6">
              <h3 className="font-bold text-sm text-slate-600 dark:text-slate-300 mb-3 uppercase tracking-wider">Anketler</h3>
              <div className="grid grid-cols-2 gap-4">
                <StatCard title="Anketler" value={stats.totalSurveys ?? 0} icon={Plus} color="bg-green-600" />
                <StatCard title="Bugün Anket" value={stats.todaySurveys ?? 0} icon={Plus} color="bg-green-700" />
              </div>
            </Card>

            {/* Sınavlar */}
            <Card className="p-6 lg:col-span-2">
              <h3 className="font-bold text-sm text-slate-600 dark:text-slate-300 mb-3 uppercase tracking-wider">Sınavlar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard title="Aktif Sınavlar" value={stats.activeExams ?? 0} icon={Plus} color="bg-rose-600" />
                <StatCard title="Toplam Sınav" value={stats.totalExams ?? 0} icon={Plus} color="bg-orange-600" />
                <StatCard title="Bugün Sınav" value={stats.todayExams ?? 0} icon={Plus} color="bg-orange-700" />
              </div>
            </Card>
          </>
        ) : (
          <div className="col-span-full text-center text-red-500">Veriler yüklenemedi</div>
        )}
      </div>

      {/* Alt Grid: Aktiviteler ve Hızlı İşlemler */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Sol Taraf: Son Aktiviteler Tablosu */}
        <Card className="p-6 xl:col-span-2">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Son Aktiviteler</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs uppercase">
                <tr>
                  <th className="py-3 pl-4">Öğrenci</th>
                  <th className="py-3 hidden sm:table-cell">İşlem</th>
                  <th className="py-3">Puan</th>
                  <th className="py-3 text-right pr-4">Zaman</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300">
                {recentActivities.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        {/* Sağ Taraf: Öğrenci Önizleme + Hızlı İşlemler */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Öğrenci Önizleme</h3>
            {students.length === 0 ? (
              <div className="text-slate-500 text-sm">Öğrenci bulunamadı</div>
            ) : (
              <ul className="space-y-3">
                {students.slice(0,5).map((s) => (
                  <li key={s._id} className="flex items-center justify-between">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{s.name || s.email}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Ort: {typeof s.averageScore === 'number' ? s.averageScore : 0}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
            <h3 className="font-bold text-lg mb-2">Hızlı İşlemler</h3>
            <p className="text-indigo-100 text-sm mb-6">Sınıfını yönetmek için kısa yollar.</p>
            <Button variant="secondary" size="md" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20">
              <div className="bg-white p-2 rounded text-indigo-600"><Plus size={16}/></div>
              <span>Soru Ekle</span>
            </Button>
            <Button variant="secondary" size="md" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 mt-3">
              <div className="bg-white p-2 rounded text-indigo-600"><Bell size={16}/></div>
              <span>Duyuru Yap</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherHome;