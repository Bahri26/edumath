import { MessageCircleWarning } from 'lucide-react';

const RiskyStudentsWidget = ({ students = [], onMessage }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md mb-6">
    <h3 className="font-bold text-lg mb-4 text-rose-600 flex items-center gap-2">
      <MessageCircleWarning size={20} /> Riskli Öğrenciler
    </h3>
    <ul className="space-y-3">
      {students.length === 0 ? (
        <li className="text-slate-400 text-sm">Riskli öğrenci yok.</li>
      ) : (
        students.map(student => (
          <li key={student.id} className="flex items-center justify-between bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl">
            <div>
              <span className="font-bold text-rose-700 dark:text-rose-300">{student.name}</span>
              <span className="ml-2 text-xs text-slate-500">{student.reason}</span>
            </div>
            <button
              onClick={() => onMessage(student)}
              className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow"
            >Mesaj At</button>
          </li>
        ))
      )}
    </ul>
  </div>
);

export default RiskyStudentsWidget;
