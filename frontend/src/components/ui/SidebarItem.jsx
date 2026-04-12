import React from 'react';

const SidebarItem = ({ icon: Icon, label, active, onClick, isCollapsed }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200 group relative ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
        : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
    }`}
  >
    <Icon size={20} className={`flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
    
    <span className={`font-medium text-sm transition-opacity duration-200 whitespace-nowrap ${
      isCollapsed ? 'opacity-0 w-0 hidden md:block' : 'opacity-100'
    }`}>
      {label}
    </span>
    
    {isCollapsed && (
      <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap hidden md:block">
        {label}
      </div>
    )}
  </button>
);

export default SidebarItem;