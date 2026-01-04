import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-center p-4">
      <h1 className="text-9xl font-bold text-indigo-600 dark:text-indigo-400">404</h1>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-4">Sayfa Bulunamadı</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-2 mb-8">Aradığınız sayfa silinmiş veya taşınmış olabilir.</p>
      
      <button 
        onClick={() => navigate('/')}
        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
      >
        Ana Sayfaya Dön
      </button>
    </div>
  );
};

export default NotFound;