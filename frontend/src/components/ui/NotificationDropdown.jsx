import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import apiClient from '../../services/api';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Verileri Çek
  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error("Bildirim hatası:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Opsiyonel: Her 30 saniyede bir yeni bildirim var mı kontrol et
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Dropdown dışına tıklanırsa kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tekil Okundu Yap
  const markAsRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) { console.error(error); }
  };

  // Tümünü Okundu Yap
  const markAllRead = async () => {
    try {
      await apiClient.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) { console.error(error); }
  };

  // Sil
  const deleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) { console.error(error); }
  };

  // İkon Seçici
  const getIcon = (type) => {
    switch(type) {
        case 'success': return <CheckCircle size={18} className="text-green-500"/>;
        case 'warning': return <AlertTriangle size={18} className="text-orange-500"/>;
        case 'error': return <XCircle size={18} className="text-red-500"/>;
        default: return <Info size={18} className="text-blue-500"/>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ZİL BUTONU */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></span>
        )}
      </button>

      {/* DROPDOWN MENÜ */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-scale-in origin-top-right">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
            <h3 className="font-bold text-slate-800 dark:text-white">Bildirimler ({unreadCount})</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
                <Check size={14}/> Tümünü Oku
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">Hiç bildiriminiz yok. 🎉</div>
            ) : (
                notifications.map((notif) => (
                    <div 
                        key={notif._id} 
                        onClick={() => !notif.isRead && markAsRead(notif._id)}
                        className={`p-4 border-b border-slate-50 dark:border-slate-700/50 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group ${!notif.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                    >
                        <div className="mt-1">{getIcon(notif.type)}</div>
                        <div className="flex-1">
                            <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-slate-800 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                                {notif.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2 text-right">
                                {new Date(notif.createdAt).toLocaleDateString('tr-TR')} • {new Date(notif.createdAt).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                            </p>
                        </div>
                        <button 
                            onClick={(e) => deleteNotification(e, notif._id)}
                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity self-start"
                        >
                            <Trash2 size={16}/>
                        </button>
                    </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;