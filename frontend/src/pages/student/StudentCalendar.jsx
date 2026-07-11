import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Loader2, X } from 'lucide-react';
import { LanguageContext } from '../../context/LanguageContext';
import StudentPageShell from '../../components/student/StudentPageShell.jsx';
import apiClient from '../../services/api';

const fmtDate = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const fmtTime = (d) => {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

const StudentCalendar = () => {
  const { language } = useContext(LanguageContext);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });

  const t = {
    TR: {
      calendar: 'Takvim',
      calendarSubtitle: 'Sınav ve ödev tarihlerini takip et.',
      upcomingEvents: 'Yaklaşan Etkinlikler',
      noEvents: 'Bu gün etkinlik yok',
      live: 'Canlı veri',
      dayDetail: 'Gün detayı',
      goQuizzes: 'Sınavlara git',
      goAssignments: 'Ödevlere git',
      close: 'Kapat',
    },
    EN: {
      calendar: 'Calendar',
      calendarSubtitle: 'Stay on top of deadlines and exams.',
      upcomingEvents: 'Upcoming Events',
      noEvents: 'No events today',
      live: 'Live data',
      dayDetail: 'Day detail',
      goQuizzes: 'Go to quizzes',
      goAssignments: 'Go to assignments',
      close: 'Close',
    },
  };
  const getText = (key) => t[language]?.[key] || t.TR[key];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [examsRes, assignRes] = await Promise.all([
          apiClient.get('/exams/by-class').catch(() => ({ data: [] })),
          apiClient.get('/assignments/student/my-assignments', { params: { page: 1, limit: 50 } }).catch(() => ({ data: { data: [] } })),
        ]);
        const examEvents = (Array.isArray(examsRes.data) ? examsRes.data : []).flatMap((exam) => {
          const list = [];
          const title = exam.title || exam.name || 'Sınav';
          const examId = exam._id;
          if (exam.startAt) {
            list.push({
              id: `exam-start-${exam._id}`,
              date: fmtDate(exam.startAt),
              time: fmtTime(exam.startAt),
              title: `${title} (başlangıç)`,
              type: 'exam',
              href: examId ? `/student/quizzes?start=${examId}` : '/student/quizzes',
            });
          }
          if (exam.endAt) {
            list.push({
              id: `exam-end-${exam._id}`,
              date: fmtDate(exam.endAt),
              time: fmtTime(exam.endAt),
              title: `${title} (bitiş)`,
              type: 'exam',
              href: '/student/quizzes',
            });
          }
          if (!exam.startAt && !exam.endAt && exam.createdAt) {
            list.push({
              id: `exam-${exam._id}`,
              date: fmtDate(exam.createdAt),
              time: '',
              title,
              type: 'exam',
              href: examId ? `/student/quizzes?start=${examId}` : '/student/quizzes',
            });
          }
          return list;
        });
        const assignmentEvents = (assignRes.data?.data || [])
          .filter((a) => a.dueDate)
          .map((a) => ({
            id: `asg-${a._id}`,
            date: fmtDate(a.dueDate),
            time: fmtTime(a.dueDate) || '23:59',
            title: a.title,
            type: a.completed ? 'submission' : 'deadline',
            href: '/student/assignments',
          }));
        if (!cancelled) setEvents([...examEvents, ...assignmentEvents].filter((e) => e.date));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const calendarDays = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const getEventsForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.date === dateStr);
  };

  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return getEventsForDate(selectedDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, events, currentDate]);

  const getEventColor = (type) => {
    switch (type) {
      case 'exam':
        return 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700';
      case 'deadline':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'submission':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
      default:
        return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700';
    }
  };

  const getEventTypeLabel = (type) => {
    if (type === 'exam') return 'Sınav';
    if (type === 'deadline') return 'Son Tarih';
    if (type === 'submission') return 'Teslim';
    return 'Etkinlik';
  };

  const upcomingEvents = useMemo(() => {
    const today = fmtDate(new Date());
    return events
      .filter((e) => e.date >= today)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 8);
  }, [events]);

  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const selectedDayLabel = selectedDay
    ? new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : '';

  return (
    <StudentPageShell
      title={getText('calendar')}
      subtitle={getText('calendarSubtitle')}
      headerAside={(
        <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-2xl border border-sky-200/60 dark:border-slate-600">
          <CalendarIcon size={24} className="text-teal-600 dark:text-teal-400" aria-hidden />
        </div>
      )}
    >
      <p className="text-[11px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold -mt-4 mb-2">
        {getText('live')}
      </p>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-teal-600" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((day) => (
                  <div key={day} className="text-center font-bold text-slate-600 dark:text-slate-400 text-sm py-2">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, idx) => {
                  const dayEvents = day ? getEventsForDate(day) : [];
                  const isToday =
                    day === new Date().getDate() &&
                    currentDate.getMonth() === new Date().getMonth() &&
                    currentDate.getFullYear() === new Date().getFullYear();
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!day}
                      onClick={() => day && setSelectedDay(day)}
                      className={`aspect-square p-2 rounded-lg border-2 transition-all text-left ${
                        !day
                          ? 'border-transparent bg-transparent cursor-default'
                          : isToday
                            ? 'bg-teal-100 dark:bg-teal-900/30 border-teal-500 hover:brightness-95'
                            : dayEvents.length > 0
                              ? 'bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 hover:border-teal-400'
                              : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {day ? (
                        <div className="space-y-1">
                          <p className={`text-sm font-bold text-center ${isToday ? 'text-teal-700' : 'text-slate-900 dark:text-slate-100'}`}>
                            {day}
                          </p>
                          {dayEvents.length > 0 ? (
                            <div className="flex justify-center gap-1">
                              {dayEvents.slice(0, 3).map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-rose-500 rounded-full" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Sınav</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500 rounded-full" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Son Tarih</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 rounded-full" />
                <span className="text-sm text-slate-600 dark:text-slate-400">Teslim</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{getText('upcomingEvents')}</h3>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={event.href || '/student/calendar'}
                    className={`block p-4 rounded-xl border-2 space-y-2 ${getEventColor(event.type)}`}
                  >
                    <div className="font-bold text-sm">{getEventTypeLabel(event.type)}</div>
                    <p className="font-semibold text-sm">{event.title}</p>
                    <div className="flex items-center gap-2 text-xs opacity-75">
                      <Clock size={14} />
                      {new Date(event.date).toLocaleDateString('tr-TR')}
                      {event.time ? ` - ${event.time}` : ''}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center border border-emerald-200 dark:border-emerald-800">
                <p className="text-emerald-700 dark:text-emerald-300 font-medium">Yaklaşan etkinlik yok</p>
              </div>
            )}

            <div className="bg-white/80 dark:bg-slate-800/80 p-4 rounded-xl border border-white/20 dark:border-slate-700 space-y-3">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Toplam Etkinlik</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{events.length}</p>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Bu Ay Sınavı</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {events.filter((e) => e.type === 'exam' && e.date.startsWith(monthKey)).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDay != null ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start gap-3">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400">{getText('dayDetail')}</p>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">{selectedDayLabel}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label={getText('close')}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">{getText('noEvents')}</p>
              ) : (
                selectedDayEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={event.href || '/student/calendar'}
                    onClick={() => setSelectedDay(null)}
                    className={`block p-3 rounded-xl border-2 ${getEventColor(event.type)}`}
                  >
                    <div className="text-xs font-bold">{getEventTypeLabel(event.type)}</div>
                    <p className="font-semibold text-sm mt-1">{event.title}</p>
                    {event.time ? (
                      <p className="text-xs opacity-75 mt-1 flex items-center gap-1">
                        <Clock size={12} /> {event.time}
                      </p>
                    ) : null}
                  </Link>
                ))
              )}
            </div>
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <Link
                to="/student/quizzes"
                onClick={() => setSelectedDay(null)}
                className="flex-1 text-center text-sm font-bold py-2 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              >
                {getText('goQuizzes')}
              </Link>
              <Link
                to="/student/assignments"
                onClick={() => setSelectedDay(null)}
                className="flex-1 text-center text-sm font-bold py-2 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
              >
                {getText('goAssignments')}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </StudentPageShell>
  );
};

export default StudentCalendar;
