import { LayoutGrid, FileText, Trophy, CheckCircle, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const navMenuItems = [
  { id: 'overview', label: 'Genel Bakış', icon: LayoutGrid, path: '/teacher/overview' },
  { id: 'questions', label: 'Soru Bankası', icon: FileText, path: '/teacher/questions' },
  { id: 'exams', label: 'Sınavlar', icon: CheckCircle, path: '/teacher/exams' },
  { id: 'exercises', label: 'Egzersizler', icon: Trophy, path: '/teacher/exercises' },
  { id: 'reports', label: 'Raporlar', icon: BarChart2, path: '/teacher/reports' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  return (
    <aside className="hidden md:block w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-white/20 dark:border-slate-800 p-6">
      <nav className="flex flex-col gap-2">
        {navMenuItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
          >
            <item.icon size={18} /> {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
