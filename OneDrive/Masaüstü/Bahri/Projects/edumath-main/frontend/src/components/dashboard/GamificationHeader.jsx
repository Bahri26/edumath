import { Flame, Gem, Star } from 'lucide-react';

const GamificationHeader = ({ xp = 1200, streak = 7, level = 5, gems = 18 }) => (
  <div className="flex gap-4 items-center mb-6">
    <div className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-xl">
      <Star size={18} className="text-yellow-500" />
      <span className="font-bold text-indigo-700 dark:text-indigo-300">XP: {xp}</span>
    </div>
    <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-xl">
      <Flame size={18} className="text-orange-500 animate-pulse" />
      <span className="font-bold text-orange-700 dark:text-orange-300">Seri: {streak}</span>
    </div>
    <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-xl">
      <Star size={18} className="text-green-500" />
      <span className="font-bold text-green-700 dark:text-green-300">Seviye: {level}</span>
    </div>
    <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-xl">
      <Gem size={18} className="text-blue-500" />
      <span className="font-bold text-blue-700 dark:text-blue-300">Elmas: {gems}</span>
    </div>
  </div>
);

export default GamificationHeader;
