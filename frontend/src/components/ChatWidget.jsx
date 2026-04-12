import React, { useState, useEffect, useRef, useContext } from 'react';
import { MessageCircle, X, Send, Smile, Paperclip, ArrowRight } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';
import apiClient from '../services/api';

const ChatWidget = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

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
      const res = await apiClient.get('/messages/conversations?limit=5');
      setConversations(res.data.data || []);
      
      // Okunmamış sayısı hesapla
      const unread = res.data.data?.reduce((count, conv) => {
        const hasUnread = conv.messages?.some(msg => !msg.isRead);
        return count + (hasUnread ? 1 : 0);
      }, 0) || 0;
      setUnreadCount(unread);

      if (res.data.data && res.data.data.length > 0 && !selectedConversation) {
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
        `/messages/conversations/${selectedConversation._id}/messages?limit=30`
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
      const otherUser = selectedConversation.participantIds.find(
        p => p._id !== localStorage.getItem('userId')
      );

      const res = await apiClient.post('/messages/send', {
        recipientId: otherUser._id,
        content: newMessage,
        conversationId: selectedConversation._id
      });

      setMessages([...messages, res.data.data]);
      setNewMessage('');
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
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl transition-all duration-300 z-40 flex items-center justify-center group ${
          isOpen
            ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
            : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:shadow-indigo-500/50 dark:from-indigo-600 dark:to-purple-700'
        }`}
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <>
            <MessageCircle size={24} className="text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Widget Modal */}
      {isOpen && (
        <div
          ref={widgetRef}
          className={`fixed bottom-24 right-6 w-96 h-[500px] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col ${
            isDarkMode ? 'bg-slate-800' : 'bg-white'
          } z-50 animate-fade-in`}
        >
          {/* Widget Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Mesajlar</h3>
              <p className="text-xs text-indigo-100">
                {conversations.length > 0 ? `${conversations.length} sohbet` : 'Sohbet yok'}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {!selectedConversation ? (
            // Conversations List
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                  Yükleniyor...
                </div>
              ) : conversations.length > 0 ? (
                conversations.map(conversation => {
                  const otherUser = getOtherUser(conversation);
                  return (
                    <button
                      key={conversation._id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full p-3 border-b border-slate-100 dark:border-slate-700 transition-colors text-left hover:bg-slate-50 dark:hover:bg-slate-700/50`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {otherUser?.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                            {otherUser?.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {conversation.lastMessage?.content || 'Henüz mesaj yok'}
                          </p>
                        </div>
                        <ArrowRight size={14} className="text-slate-400 flex-shrink-0" />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                  Henüz sohbet yok
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-slate-900">
                {messages.length > 0 ? (
                  messages.map((message, idx) => {
                    const isSent = message.senderId._id === localStorage.getItem('userId');
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs rounded-2xl px-3 py-2 text-sm ${
                            isSent
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none'
                          }`}
                        >
                          <p>{message.content}</p>
                          <span className={`text-xs mt-1 block ${
                            isSent ? 'text-indigo-100' : 'text-slate-600 dark:text-slate-400'
                          }`}>
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm">
                    Henüz mesaj yok
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
                  >
                    <Paperclip size={16} />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Mesaj yaz..."
                    className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </form>

                {/* Back Button */}
                <button
                  onClick={() => {
                    setSelectedConversation(null);
                    setMessages([]);
                  }}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs font-medium"
                >
                  ← Geri Dön
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
};

export default ChatWidget;
