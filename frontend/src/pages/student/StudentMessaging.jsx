import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  Send, 
  Search, 
  MoreVertical, 
  ChevronLeft,
  UserPlus,
  X,
  Smile,
  Paperclip,
  Phone,
  Video
} from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import apiClient from '../../services/api';

const StudentMessaging = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const { language } = useContext(LanguageContext);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const t = {
    TR: {
      pageTitle: 'Mesajlar',
      inbox: 'Gelen Kutusu',
      newMessage: 'Yeni Mesaj',
      typeMessage: 'Mesajınızı yazın...',
      send: 'Gönder',
      loading: 'Yükleniyor...',
      noMessages: 'Mesajlar yok',
      noConversations: 'Henüz kimseyle sohbet etmediniz',
      startChat: 'Sohbete başlamak için birini seçin',
      search: 'Mesajlarda ara...',
      today: 'Bugün',
      yesterday: 'Dün',
      online: 'Çevrimiçi',
      offline: 'Çevrimdışı'
    },
    EN: {
      pageTitle: 'Messages',
      inbox: 'Inbox',
      newMessage: 'New Message',
      typeMessage: 'Type your message...',
      send: 'Send',
      loading: 'Loading...',
      noMessages: 'No messages',
      noConversations: 'You haven\'t chatted with anyone yet',
      startChat: 'Select someone to start chatting',
      search: 'Search messages...',
      today: 'Today',
      yesterday: 'Yesterday',
      online: 'Online',
      offline: 'Offline'
    }
  };

  const getText = (key) => t[language][key] || key;

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/messages/conversations');
      setConversations(res.data.data || []);
      if (res.data.data && res.data.data.length > 0) {
        setSelectedConversation(res.data.data[0]);
      }
    } catch (err) {
      console.error('Konuşmalar alınırken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await apiClient.get(
        `/messages/conversations/${selectedConversation._id}/messages`
      );
      setMessages(res.data.data || []);
    } catch (err) {
      console.error('Mesajlar alınırken hata:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const res = await apiClient.post('/messages/send', {
        recipientId: selectedConversation.participantIds.find(
          p => p._id !== localStorage.getItem('userId')
        )._id,
        content: newMessage,
        conversationId: selectedConversation._id
      });

      setMessages([...messages, res.data.data]);
      setNewMessage('');

      // Konuşmayı güncelle
      setConversations(conversations.map(conv =>
        conv._id === selectedConversation._id
          ? { ...conv, lastMessage: res.data.data, lastMessageAt: new Date() }
          : conv
      ));
    } catch (err) {
      console.error('Mesaj gönderi lerken hata:', err);
    }
  };

  const getOtherUser = (conversation) => {
    return conversation.participantIds.find(
      p => p._id !== localStorage.getItem('userId')
    );
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return getText('yesterday');
    } else {
      return date.toLocaleDateString('tr-TR');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    getOtherUser(conv)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`h-screen flex ${isDarkMode ? 'dark' : ''}`}>
      {/* Conversations List */}
      <div className="w-full md:w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            {getText('pageTitle')}
          </h1>
          
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={getText('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              {getText('loading')}
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map(conversation => {
              const otherUser = getOtherUser(conversation);
              return (
                <button
                  key={conversation._id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-4 border-b border-slate-100 dark:border-slate-700 transition-colors text-left ${
                    selectedConversation?._id === conversation._id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {otherUser?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {otherUser?.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {otherUser?.role === 'teacher' ? 'Öğretmen' : 'Öğrenci'}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                      {conversation.lastMessageAt && formatTime(conversation.lastMessageAt)}
                    </span>
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {conversation.lastMessage.content}
                    </p>
                  )}
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              {getText('noConversations')}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden md:flex flex-1 flex-col bg-white dark:bg-slate-900">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {getOtherUser(selectedConversation)?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">
                    {getOtherUser(selectedConversation)?.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {getText('online')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400">
                  <Phone size={18} />
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400">
                  <Video size={18} />
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length > 0 ? (
                messages.map((message, idx) => {
                  const isSent = message.senderId._id === localStorage.getItem('userId');
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs rounded-2xl px-4 py-2 ${
                          isSent
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <span className={`text-xs mt-1 block ${
                          isSent ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                  {getText('noMessages')}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
                >
                  <Paperclip size={18} />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
                >
                  <Smile size={18} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={getText('typeMessage')}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
            {getText('startChat')}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMessaging;
