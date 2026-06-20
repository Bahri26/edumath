import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import apiClient from '../../services/api';
import { MESSAGES, lookupMessage, formatMessage } from '../../i18n/messages';
import { getGuestChatReply } from '../../utils/chatGuestReplies';

function resolveLocale(langProp) {
  if (!langProp) return 'TR';
  return String(langProp).toLowerCase() === 'en' ? 'EN' : 'TR';
}

function hasAuthToken() {
  try {
    return Boolean(localStorage.getItem('token'));
  } catch {
    return false;
  }
}

const Chatbox = ({ lang: langProp }) => {
  const locale = resolveLocale(langProp);
  const catalog = MESSAGES[locale] || MESSAGES.TR;
  const guestReplies = catalog.chat?.guestReplies || MESSAGES.TR.chat.guestReplies;

  const t = useCallback(
    (key, params) => {
      const value = lookupMessage(catalog, key);
      if (value == null) return key;
      return formatMessage(value, params);
    },
    [catalog],
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isGuest] = useState(() => !hasAuthToken());
  const [provider, setProvider] = useState('local');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setMessages([
      {
        id: 'welcome',
        text: t('chat.guestWelcome'),
        sender: 'bot',
      },
    ]);
  }, [isOpen, locale, t]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    apiClient
      .get('/ai/public-info')
      .then((res) => {
        if (!cancelled && res.data?.provider) setProvider(res.data.provider);
      })
      .catch(() => {
        if (!cancelled) setProvider('local');
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isTyping]);

  const providerLabel = useMemo(() => {
    const key = `chat.provider.${provider}`;
    const value = lookupMessage(catalog, key);
    return value != null ? formatMessage(value) : t('chat.provider.unknown');
  }, [catalog, provider, t]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = { id: Date.now(), text: input.trim(), sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      if (isGuest || !hasAuthToken()) {
        await new Promise((r) => setTimeout(r, 400));
        const reply = getGuestChatReply(userMsg.text, locale, guestReplies);
        setMessages((prev) => [...prev, { id: Date.now() + 1, text: reply, sender: 'bot' }]);
      } else {
        const res = await apiClient.post('/chat', { message: userMsg.text });
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, text: res.data.reply, sender: 'bot' },
        ]);
        if (res.data?.provider) setProvider(res.data.provider);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, text: t('chat.error'), sender: 'bot' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const statusLabel = isGuest ? t('chat.guestMode') : t('chat.online');

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-scale-in origin-bottom-right">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2 min-w-0">
              <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
                <Bot size={20} aria-hidden />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm truncate">{t('chat.title')}</h3>
                <p className="text-xs text-indigo-100 flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${isGuest ? 'bg-amber-300' : 'bg-green-400 animate-pulse'}`}
                    aria-hidden
                  />
                  <span>{statusLabel}</span>
                  <span className="opacity-75">· {providerLabel}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded-lg transition-colors shrink-0"
              aria-label={locale === 'EN' ? 'Close chat' : 'Sohbeti kapat'}
            >
              <X size={20} />
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 size={14} className="animate-spin" aria-hidden />
                  {t('chat.thinking')}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {isGuest && (
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-100 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
              <span>{t('chat.guestHint')}</span>
              <Link
                to="/login"
                className="shrink-0 font-bold text-indigo-700 dark:text-indigo-300 hover:underline"
              >
                {t('chat.loginCta')}
              </Link>
            </div>
          )}

          <form
            onSubmit={handleSend}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2"
          >
            <input
              type="text"
              placeholder={t('chat.placeholder')}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label={t('chat.placeholder')}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors"
              aria-label={t('chat.send')}
            >
              {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 ${
          isOpen ? 'bg-slate-800 rotate-90' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-110'
        }`}
        aria-label={isOpen ? (locale === 'EN' ? 'Close assistant' : 'Asistanı kapat') : t('chat.title')}
      >
        {isOpen ? (
          <X size={24} className="text-white" />
        ) : (
          <div className="relative">
            <Sparkles
              size={24}
              className="text-white absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              aria-hidden
            />
            <MessageSquare size={28} className="text-white" />
          </div>
        )}
      </button>
    </div>
  );
};

export default Chatbox;
