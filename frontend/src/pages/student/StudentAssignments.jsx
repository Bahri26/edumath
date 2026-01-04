// src/pages/student/StudentAssignments.jsx
import React, { useState, useContext, useEffect } from 'react';
import { Target, BookOpen, Calendar, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { LanguageContext } from '../../context/LanguageContext';
import { ThemeContext } from '../../context/ThemeContext';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';

const StudentAssignments = () => {
  const { language } = useContext(LanguageContext);
  const { isDarkMode } = useContext(ThemeContext);
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'completed'
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- DİL ÇEVIRILERI ---
  const t = {
    TR: {
      pageTitle: "Ödevlerim",
      pageSubtitle: "Ders başarılarını artırmak için ödevlerini zamanında tamamla.",
      allTasks: "Hepsi",
      pending: "Bekleyenler",
      completed: "Tamamlanan",
      noDueTasks: "Bu kategoride görüntülenecek ödev yok.",
      detailsBtn: "Detaylar",
      dueDate: "Son Tarih",
      urgent: "Acil",
      noAssignments: "Henüz ödev yok",
      loading: "Yükleniyor...",
    },
    EN: {
      pageTitle: "My Assignments",
      pageSubtitle: "Complete your assignments on time to improve your grades.",
      allTasks: "All",
      pending: "Pending",
      completed: "Completed",
      noDueTasks: "No assignments to display in this category.",
      detailsBtn: "Details",
      dueDate: "Due Date",
      urgent: "Urgent",
      noAssignments: "No assignments yet",
      loading: "Loading...",
    }
  };

  const getText = (key) => t[language]?.[key] || t.TR[key];

  // API'den ödevleri çek
  useEffect(() => {
    fetchAssignments();
  }, [page]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/assignments/student/my-assignments', {
        params: { page, limit: 10 }
      });
      
      if (res.data.data) {
        setAssignments(res.data.data);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      showToast('Ödevler yüklenemedi', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Veriyi filtrele
  const filteredAssignments = assignments.filter(task => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return !task.completed;
    if (activeTab === 'completed') return task.completed;
    return true;
  });

  // Deadline formatı
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Tarih yok';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Bugün';
    if (date.toDateString() === tomorrow.toDateString()) return 'Yarın';
    
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Urgent kontrolü (deadline yarından az ise)
  const isUrgent = (dueDate) => {
    if (!dueDate) return false;
    const date = new Date(dueDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date <= tomorrow;
  };

  // Tab Butonu Bileşeni
  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        activeTab === id 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <div className="animate-fade-in space-y-6">
       
       <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{getText("pageTitle")}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{getText("pageSubtitle")}</p>
          </div>
          
          {/* Sekmeler */}
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
             <TabButton id="all" label={getText("allTasks")} icon={BookOpen} />
             <TabButton id="pending" label={getText("pending")} icon={Clock} />
             <TabButton id="completed" label={getText("completed")} icon={CheckCircle2} />
          </div>
       </div>

       {/* Liste */}
       <div className="grid gap-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-indigo-600 dark:text-indigo-400" size={32} />
            </div>
          ) : filteredAssignments.length > 0 ? (
            filteredAssignments.map((task) => (
              <div key={task._id} className="group bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start md:items-center">
                  
                  {/* İkon */}
                  <div className={`p-4 rounded-2xl flex-shrink-0 ${
                      task.type === 'Sınav' ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  }`}>
                      {task.type === 'Sınav' ? <Target size={24}/> : <BookOpen size={24}/>}
                  </div>

                  {/* İçerik */}
                  <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                          <div>
                              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{task.subject || 'Matematik'}</span>
                              <h4 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{task.title}</h4>
                          </div>
                          <div className="flex gap-2 items-center">
                              {isUrgent(task.dueDate) && (
                                  <span className="bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold animate-pulse">
                                      <AlertCircle size={12} /> {getText("urgent")}
                                  </span>
                              )}
                              {task.completed && (
                                  <span className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold">
                                      <CheckCircle2 size={12} /> {getText("completed")}
                                  </span>
                              )}
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5"><Calendar size={15} className="text-indigo-400 dark:text-indigo-500"/> {getText("dueDate")}: <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(task.dueDate)}</span></span>
                      </div>

                      {/* İlerleme Çubuğu */}
                      {!task.completed && (
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{width: '30%'}}></div>
                        </div>
                      )}
                  </div>

                  {/* Buton */}
                  <div className="w-full md:w-auto">
                      <button className="w-full px-6 py-3 bg-white dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 hover:border-indigo-600 dark:hover:border-indigo-500 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold rounded-xl transition-all shadow-sm hover:shadow-md">
                          {getText("detailsBtn")}
                      </button>
                  </div>
              </div>
            ))
          ) : (
             <div className="text-center py-12 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                 <CheckCircle2 size={48} className="mx-auto mb-3 opacity-20" />
                 <p>{getText("noDueTasks")}</p>
             </div>
          )}
       </div>
    </div>
  );
};

export default StudentAssignments;