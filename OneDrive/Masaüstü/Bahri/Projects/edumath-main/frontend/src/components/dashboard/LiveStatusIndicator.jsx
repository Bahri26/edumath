import { Users } from 'lucide-react';

const LiveStatusIndicator = ({ activeStudents = 12, inExam = 3 }) => (
  <div className="flex gap-4 mb-6">
    <div className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-xl">
      <Users size={18} className="text-indigo-500 animate-pulse" />
      <span className="font-bold text-indigo-700 dark:text-indigo-300">Aktif Öğrenci: {activeStudents}</span>
    </div>
    <div className="flex items-center gap-2 bg-rose-100 dark:bg-rose-900/30 px-3 py-1 rounded-xl">
      <Users size={18} className="text-rose-500 animate-pulse" />
      <span className="font-bold text-rose-700 dark:text-rose-300">Sınavda: {inExam}</span>
    </div>
  </div>
);

export default LiveStatusIndicator;
