import { Plus, Megaphone, FileText } from 'lucide-react';

const QuickActions = ({ onAssignHomework, onAnnounce, onAddQuestion }) => (
  <div className="flex gap-4 mb-6">
    <button
      onClick={onAssignHomework}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg transition-all"
    >
      <FileText size={18} /> Hızlı Ödev Ata
    </button>
    <button
      onClick={onAnnounce}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all"
    >
      <Megaphone size={18} /> Duyuru Yap
    </button>
    <button
      onClick={onAddQuestion}
      className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-all"
    >
      <Plus size={18} /> Yeni Soru Ekle
    </button>
  </div>
);

export default QuickActions;
