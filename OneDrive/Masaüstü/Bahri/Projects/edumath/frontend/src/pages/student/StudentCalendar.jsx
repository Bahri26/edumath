import React, { useState, useMemo, useContext } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, AlertCircle } from 'lucide-react';
import { LanguageContext } from '../../context/LanguageContext';

const StudentCalendar = () => {
  const { language } = useContext(LanguageContext);

  // --- DİL ÇEVIRILERI ---
  const t = {
    TR: {
      calendar: "Takvim",
      upcomingEvents: "Yaklaşan Etkinlikler",
      noEvents: "Bu gün etkinlik yok",
    },
    EN: {
      calendar: "Calendar",
      upcomingEvents: "Upcoming Events",
      noEvents: "No events today",
    }
  };

  const getText = (key) => t[language]?.[key] || t.TR[key];
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 17)); // December 17, 2025

  // Mock Calendar Events
  const events = [
    { date: '2025-12-18', title: 'Matematik Ödevinin Son Tarihi', type: 'deadline', time: '23:59' },
    { date: '2025-12-19', title: 'Fizik Sınavı', type: 'exam', time: '09:00' },
    { date: '2025-12-22', title: 'İngilizce Proje Sunumu', type: 'submission', time: '14:00' },
    { date: '2025-12-24', title: 'Kimya Quiz', type: 'exam', time: '10:30' },
    { date: '2025-12-27', title: 'Tarih Ödevinin Son Tarihi', type: 'deadline', time: '18:00' },
    { date: '2025-12-29', title: 'Geometri Sınavı', type: 'exam', time: '13:00' },
  ];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => null);

  const calendarDays = [...emptyDays, ...monthDays];

  const getEventsForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'exam':
        return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700';
      case 'deadline':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'submission':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
      default:
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700';
    }
  };

  const getEventTypeLabel = (type) => {
    switch (type) {
      case 'exam':
        return '📝 Sınav';
      case 'deadline':
        return '⏰ Son Tarih';
      case 'submission':
        return '📤 Sunum';
      default:
        return '📌 Etkinlik';
    }
  };

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= currentDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <Calendar size={24} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Takvim</h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">Akademik takvimini yönet ve önemli etkinlikleri takip et.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calendar Header with Navigation */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map(day => (
                <div key={day} className="text-center font-bold text-slate-600 dark:text-slate-400 text-sm py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const dayEvents = day ? getEventsForDate(day) : [];
                const isToday = day === new Date().getDate() && 
                               currentDate.getMonth() === new Date().getMonth() &&
                               currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={idx}
                    className={`aspect-square p-2 rounded-lg border-2 transition-all ${
                      !day
                        ? 'border-transparent bg-transparent'
                        : isToday
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-600'
                        : dayEvents.length > 0
                        ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                        : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {day && (
                      <div className="space-y-1">
                        <p className={`text-sm font-bold text-center ${isToday ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-slate-100'}`}>
                          {day}
                        </p>
                        {dayEvents.length > 0 && (
                          <div className="flex justify-center gap-1">
                            {dayEvents.slice(0, 2).map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full"></div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-rose-500 rounded-full"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Sınav</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Son Tarih</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Sunum</span>
            </div>
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Yaklaşan Etkinlikler</h3>
          
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3">
              {upcomingEvents.map((event, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-2 space-y-2 ${getEventColor(event.type)}`}
                >
                  <div className="font-bold text-sm">{getEventTypeLabel(event.type)}</div>
                  <p className="font-semibold text-sm">{event.title}</p>
                  <div className="flex items-center gap-2 text-xs opacity-75">
                    <Clock size={14} />
                    {new Date(event.date).toLocaleDateString('tr-TR')} - {event.time}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center border border-emerald-200 dark:border-emerald-800">
              <p className="text-emerald-700 dark:text-emerald-300 font-medium">✨ Yaklaşan etkinlik yok!</p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-white/20 dark:border-slate-700 space-y-3">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Toplam Etkinlik</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{events.length}</p>
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Bu Ay Sınavı</p>
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {events.filter(e => e.type === 'exam' && e.date.startsWith(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCalendar;
