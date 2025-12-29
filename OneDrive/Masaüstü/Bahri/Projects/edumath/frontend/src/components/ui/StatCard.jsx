import React from 'react';

const StatCard = ({ title, value, change, icon: Icon, color }) => {
  // Renk sınıflarını map'le (dinamik sınıflar Tailwind'de çalışmaz)
  const colorMap = {
    'bg-blue-600': 'text-blue-600',
    'bg-purple-600': 'text-purple-600',
    'bg-green-600': 'text-green-600',
    'bg-indigo-600': 'text-indigo-600',
    'bg-red-600': 'text-red-600',
    'bg-orange-600': 'text-orange-600',
    'bg-pink-600': 'text-pink-600',
    'bg-yellow-600': 'text-yellow-600',
  };
  
  const textColor = colorMap[color] || 'text-blue-600';
  const bgColor = color.replace('bg-', 'bg-opacity-10 ') || 'bg-blue-100';

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md dark:hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
          <Icon size={22} className={textColor} />
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center text-xs font-medium text-slate-400">
          <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded mr-2">{change}</span>
          <span>geçen haftaya göre</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;