import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  Trash2,
  Info,
  ClipboardList,
  FileText,
  MessageSquare,
  BarChart2,
  Megaphone,
} from 'lucide-react';
import apiClient from '../../services/api';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import { AuthContext } from '../../context/AuthContext';

const NotificationDropdown = () => {
  const { askConfirm, ConfirmDialog } = useConfirmAction();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const role = user?.role || 'student';
  const settingsPath = `/${role}/settings`;

  const fetchNotifications = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    try {
      const res = await apiClient.get('/notifications?limit=20');
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.notifications)
            ? raw.notifications
            : [];
      setNotifications(list);
      const serverUnread = Number(raw?.unreadCount);
      setUnreadCount(
        Number.isFinite(serverUnread)
          ? serverUnread
          : list.filter((n) => !n.isRead).length,
      );
    } catch (error) {
      console.warn('Bildirim alınamadı', error?.response?.status);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteNotification = async (e, id) => {
    e.stopPropagation();
    const confirmed = await askConfirm({
      title: 'Bildirim kaldırılsın mı?',
      description: 'Bu bildirim listenizden kalıcı olarak silinecek.',
    });
    if (!confirmed) return;
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications((prev) => {
        const target = prev.find((n) => n._id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== id);
      });
    } catch (error) {
      console.error(error);
    }
  };

  const resolveActionUrl = (notif) => {
    if (notif.actionUrl) return notif.actionUrl;
    switch (notif.type) {
      case 'assignment':
        return role === 'student' ? '/student/assignments' : '/teacher/assignments';
      case 'exam':
        return role === 'student' ? '/student/quizzes' : '/teacher/exams';
      case 'message':
        return `/${role}/messages`;
      case 'survey':
        return `/${role}/surveys`;
      case 'grade':
        return role === 'student' ? '/student/home' : '/teacher/reports';
      default:
        return settingsPath;
    }
  };

  const openNotification = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    setIsOpen(false);
    navigate(resolveActionUrl(notif));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <ClipboardList size={18} className="text-teal-600 dark:text-teal-400" />;
      case 'exam':
        return <FileText size={18} className="text-sky-600 dark:text-sky-400" />;
      case 'message':
        return <MessageSquare size={18} className="text-amber-600 dark:text-amber-400" />;
      case 'survey':
        return <BarChart2 size={18} className="text-slate-500" />;
      case 'grade':
        return <Megaphone size={18} className="text-emerald-600" />;
      default:
        return <Info size={18} className="text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
        aria-label={unreadCount > 0 ? `Bildirimler (${unreadCount} okunmamış)` : 'Bildirimler'}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center text-[10px] font-bold leading-none text-white bg-teal-600 border-2 border-white dark:border-slate-800 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-scale-in origin-top-right">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
            <h3 className="font-bold text-slate-800 dark:text-white">
              Bildirimler{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1"
              >
                <Check size={14} /> Tümünü oku
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Henüz bildiriminiz yok.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => openNotification(notif)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openNotification(notif);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={`p-4 border-b border-slate-50 dark:border-slate-700/50 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group ${
                    !notif.isRead ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''
                  }`}
                >
                  <div className="mt-1 shrink-0">{getIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm truncate ${
                        !notif.isRead
                          ? 'font-bold text-slate-800 dark:text-white'
                          : 'font-medium text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {notif.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-2 text-right">
                      {new Date(notif.createdAt).toLocaleDateString('tr-TR')} •{' '}
                      {new Date(notif.createdAt).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => deleteNotification(e, notif._id)}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity self-start"
                    aria-label="Bildirimi sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(settingsPath);
              }}
              className="w-full text-center text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline"
            >
              Tüm bildirimler ve ayarlar
            </button>
          </div>
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
};

export default NotificationDropdown;
