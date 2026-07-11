import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { Send, Search, UserPlus, X, Loader2 } from 'lucide-react';
import { LanguageContext } from '../../context/LanguageContext';
import { AuthContext } from '../../context/AuthContext';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StudentPageShell from '../student/StudentPageShell.jsx';
import TeacherPageShell from '../teacher/TeacherPageShell.jsx';

export default function MessagingPage({ role = 'student' }) {
  const { language } = useContext(LanguageContext);
  const { user } = useContext(AuthContext) || {};
  const { showToast } = useToast();
  const myId = String(user?._id || user?.id || localStorage.getItem('userId') || '');

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const t = {
    TR: {
      pageTitle: 'Mesajlar',
      inbox: 'Gelen Kutusu',
      typeMessage: 'Mesajınızı yazın...',
      send: 'Gönder',
      noConversations: 'Henüz kimseyle sohbet etmediniz',
      startChat: 'Sohbete başlamak için birini seçin',
      search: 'Mesajlarda ara...',
      yesterday: 'Dün',
      newChat: 'Yeni sohbet',
      pickStudent: 'Öğrenci seç',
      pickTeacher: 'Öğretmen seç',
      noStudents: 'Sınıf listesinde öğrenci yok',
      noTeachers: 'Bağlı öğretmen bulunamadı',
    },
    EN: {
      pageTitle: 'Messages',
      inbox: 'Inbox',
      typeMessage: 'Type your message...',
      send: 'Send',
      noConversations: "You haven't chatted with anyone yet",
      startChat: 'Select someone to start chatting',
      search: 'Search messages...',
      yesterday: 'Yesterday',
      newChat: 'New chat',
      pickStudent: 'Pick a student',
      pickTeacher: 'Pick a teacher',
      noStudents: 'No students in roster',
      noTeachers: 'No linked teachers found',
    },
  };
  const getText = (key) => t[language]?.[key] || t.TR[key];

  const getOtherUser = (conversation) =>
    (conversation?.participantIds || []).find((p) => String(p._id) !== myId);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/messages/conversations');
      const list = res.data.data || [];
      setConversations(list);
      setSelectedConversation((prev) => prev || list[0] || null);
    } catch {
      showToast('Konuşmalar yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedConversation) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(
          `/messages/conversations/${selectedConversation._id}/messages`,
        );
        if (!cancelled) setMessages(res.data.data || []);
        await apiClient.put(`/messages/conversations/${selectedConversation._id}/read`);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    const other = getOtherUser(selectedConversation);
    if (!other?._id) return;
    try {
      const res = await apiClient.post('/messages/send', {
        recipientId: other._id,
        content: newMessage.trim(),
        conversationId: selectedConversation._id,
      });
      setMessages((prev) => [...prev, res.data.data]);
      setNewMessage('');
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === selectedConversation._id
            ? { ...conv, lastMessage: res.data.data, lastMessageAt: new Date() }
            : conv,
        ),
      );
    } catch {
      showToast('Mesaj gönderilemedi', 'error');
    }
  };

  const openNewChatPicker = async () => {
    setShowNewChat(true);
    setRosterLoading(true);
    try {
      if (role === 'teacher') {
        const res = await apiClient.get('/teacher/students');
        setRoster(res.data?.students || []);
      } else {
        const res = await apiClient.get('/me/teachers');
        setRoster(
          (res.data?.data || []).map((t) => ({
            _id: t.teacherId,
            userId: t.teacherId,
            name: t.name,
            email: t.email,
            grade: t.grade,
          })),
        );
      }
    } catch {
      showToast(role === 'teacher' ? 'Öğrenci listesi alınamadı' : 'Öğretmen listesi alınamadı', 'error');
      setRoster([]);
    } finally {
      setRosterLoading(false);
    }
  };

  const startChatWith = async (userId) => {
    if (!userId) return;
    try {
      await apiClient.post('/messages/send', {
        recipientId: userId,
        content: 'Merhaba!',
      });
      setShowNewChat(false);
      await fetchConversations();
      showToast('Sohbet başlatıldı', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Sohbet başlatılamadı', 'error');
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }
    if (date.toDateString() === yesterday.toDateString()) return getText('yesterday');
    return date.toLocaleDateString('tr-TR');
  };

  const filteredConversations = useMemo(
    () =>
      conversations.filter((conv) =>
        (getOtherUser(conv)?.name || '').toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversations, searchTerm, myId],
  );

  const newChatButton = (
    <button
      type="button"
      onClick={openNewChatPicker}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-sm min-h-[44px]"
    >
      <UserPlus size={16} /> {getText('newChat')}
    </button>
  );

  const content = (
    <>
      {role !== 'teacher' ? (
        <div className="flex justify-end mb-2">{newChatButton}</div>
      ) : null}

      <div className="flex flex-col md:flex-row rounded-2xl border border-sky-200/70 dark:border-slate-600 overflow-hidden min-h-[22rem] md:min-h-[min(560px,calc(100vh-12rem))] max-h-[min(85vh,calc(100vh-9rem))] bg-white dark:bg-slate-800 shadow-sm">
        <div className="w-full md:w-80 shrink-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={getText('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
            ) : filteredConversations.length === 0 ? (
              <p className="p-4 text-sm text-slate-400">{getText('noConversations')}</p>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherUser(conv);
                const active = selectedConversation?._id === conv._id;
                return (
                  <button
                    key={conv._id}
                    type="button"
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${active ? 'bg-teal-50 dark:bg-teal-950/30' : ''}`}
                  >
                    <p className="font-bold text-sm text-slate-800 dark:text-white truncate">
                      {other?.name || other?.email || 'Kullanıcı'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{conv.lastMessage?.content || '—'}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm p-6">
              {getText('startChat')}
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-white">
                {getOtherUser(selectedConversation)?.name || 'Sohbet'}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => {
                  const mine = String(m.senderId?._id || m.senderId) === myId;
                  return (
                    <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${mine ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white'}`}>
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        <p className={`text-[10px] mt-1 ${mine ? 'text-teal-100' : 'text-slate-400'}`}>
                          {formatTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={getText('typeMessage')}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold inline-flex items-center gap-1"
                >
                  <Send size={16} /> {getText('send')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {showNewChat ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-black">{role === 'teacher' ? getText('pickStudent') : getText('pickTeacher')}</h3>
              <button type="button" onClick={() => setShowNewChat(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {rosterLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
              ) : roster.length === 0 ? (
                <p className="p-4 text-sm text-slate-400">
                  {role === 'teacher' ? getText('noStudents') : getText('noTeachers')}
                </p>
              ) : (
                roster.map((s) => (
                  <button
                    key={s._id || s.userId}
                    type="button"
                    disabled={!s.userId}
                    onClick={() => startChatWith(s.userId)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40"
                  >
                    <p className="font-bold text-sm">{s.name || s.email}</p>
                    <p className="text-xs text-slate-500">{s.grade} · {s.email}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  if (role === 'teacher') {
    return (
      <TeacherPageShell
        maxWidthClass="max-w-6xl"
        title={getText('pageTitle')}
        subtitle={getText('inbox')}
        headerAside={newChatButton}
      >
        {content}
      </TeacherPageShell>
    );
  }

  return (
    <StudentPageShell title={getText('pageTitle')} subtitle={getText('inbox')}>
      {content}
    </StudentPageShell>
  );
}
