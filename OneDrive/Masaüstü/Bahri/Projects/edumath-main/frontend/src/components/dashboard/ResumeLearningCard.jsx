import { Play } from 'lucide-react';

const ResumeLearningCard = ({ topic = "Java: Döngüler", progress = 65, onContinue }) => {
  return (
    <div className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-xl mb-8 relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-transform">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
          <Play size={32} />
        </div>
        <div className="flex-1">
          <span className="bg-orange-500/20 text-orange-100 text-[10px] font-bold px-2 py-0.5 rounded-full">SON ÇALIŞMA</span>
          <h2 className="text-2xl font-bold mt-1">{topic}</h2>
          <div className="w-full bg-black/20 rounded-full h-2 mt-2">
            <div className="bg-white h-full rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <button
          onClick={onContinue}
          className="ml-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-all"
        >
          Devam Et
        </button>
      </div>
    </div>
  );
};

export default ResumeLearningCard;
