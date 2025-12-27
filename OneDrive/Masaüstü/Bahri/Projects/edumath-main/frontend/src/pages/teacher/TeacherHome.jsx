import React, { useState } from 'react';
import { Plus, Bell } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import ActivityRow from '../../components/ui/ActivityRow';
import { useToast } from '../../context/ToastContext';

const TeacherHome = () => {
  // const { stats, loading } = useTeacherStats();
  const { showToast } = useToast();
  const [loading] = useState(false);

  // Mock stats
  const stats = {
    totalStudents: 28,
    classAverage: 78.5,
    completedExams: 12,
    pendingAssignments: 5,
    totalQuestions: 42
  };

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
            {stats ? `${stats.totalStudents} öğrenciniz var, Sınıf ortalaması: ${stats.classAverage}` : 'Verileri yükleniyor...'}
          </p>
        </div>
        <button 
          onClick={() => showToast('Yeni sınav oluşturma özelliği yakında!', 'info')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-colors"
        >
          <Plus size={18} /> Yeni Sınav Oluştur
        </button>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">Yükleniyor...</div>
        ) : stats ? (
          <>
            <StatCard 
              title="Toplam Öğrenci" 
              value={stats.totalStudents} 
              icon={Plus} 
              color="bg-blue-600"
            />
            <StatCard 
              title="Soru Bankası" 
              value={stats.totalQuestions} 
              icon={Plus} 
              color="bg-purple-600"
            />
            <StatCard 
              title="Anketler" 
              value={stats.totalSurveys} 
              icon={Plus} 
              color="bg-green-600"
            />
            <StatCard 
              title="Sınıf Ortalaması" 
              value={`${stats.classAverage}%`} 
              icon={Plus} 
              color="bg-indigo-600"
            />
          </>
        ) : (
          <div className="col-span-full text-center text-red-500">Veriler yüklenemedi</div>
        )}
      </div>

      {/* Alt Grid: Aktiviteler ve Hızlı İşlemler */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Sol Taraf: Son Aktiviteler Tablosu */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
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
        </div>
        
        {/* Sağ Taraf: Hızlı İşlemler Kartı */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
            <h3 className="font-bold text-lg mb-2">Hızlı İşlemler</h3>
            <p className="text-indigo-100 text-sm mb-6">Sınıfını yönetmek için kısa yollar.</p>
            
            <button className="w-full bg-white/10 p-3 rounded-xl flex items-center gap-3 mb-3 hover:bg-white/20 transition-colors">
                <div className="bg-white p-2 rounded text-indigo-600"><Plus size={16}/></div>
                <span>Soru Ekle</span>
            </button>
            
            <button className="w-full bg-white/10 p-3 rounded-xl flex items-center gap-3 hover:bg-white/20 transition-colors">
                <div className="bg-white p-2 rounded text-indigo-600"><Bell size={16}/></div>
                <span>Duyuru Yap</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherHome;