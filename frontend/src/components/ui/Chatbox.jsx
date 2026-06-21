import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { X, Send, Bot, Loader2 } from 'lucide-react';
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

const Chatbox = ({ lang: langProp, onLoginClick }) => {
  const locale = resolveLocale(langProp);
  const catalog = MESSAGES[locale] || MESSAGES.TR;
  const guestReplies = catalog.chat?.guestReplies || MESSAGES.TR.chat.guestReplies;
  const quickReplies = catalog.chat?.quickReplies || MESSAGES.TR.chat.quickReplies;

  const t = useCallback(
    (key, params) => {
      const value = lookupMessage(catalog, key);
      if (value == null) return key;
      return formatMessage(value, params);
    },
    [catalog],
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(() => !hasAuthToken());
  const [provider, setProvider] = useState('local');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const welcomeForLocale = useRef('');

  useEffect(() => {
    setIsGuest(!hasAuthToken());
  }, [isOpen]);

  const seedWelcome = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        text: t('chat.guestWelcome'),
        sender: 'bot',
      },
    ]);
    welcomeForLocale.current = locale;
  }, [locale, t]);

  useEffect(() => {
    if (!isOpen) return;
    if (welcomeForLocale.current !== locale || messages.length === 0) {
      seedWelcome();
    }
  }, [isOpen, locale, messages.length, seedWelcome]);

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

  const dispatchMessage = async (text) => {
    const trimmed = String(text || '').trim();
    if (!trimmed || isTyping) return;

    const userMsg = { id: Date.now(), text: trimmed, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      if (isGuest || !hasAuthToken()) {
        await new Promise((r) => setTimeout(r, 400));
        const reply = getGuestChatReply(trimmed, locale, guestReplies);
        setMessages((prev) => [...prev, { id: Date.now() + 1, text: reply, sender: 'bot' }]);
      } else {
        const res = await apiClient.post('/chat', { message: trimmed });
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

  const handleSend = (e) => {
    e.preventDefault();
    dispatchMessage(input);
  };

  const handleLogin = () => {
    if (typeof onLoginClick === 'function') {
      onLoginClick();
      return;
    }
    window.location.href = '/';
  };

  const statusLabel = isGuest ? t('chat.guestMode') : t('chat.online');

  return (
    <div
      className={`fixed z-50 flex flex-col ${
        isOpen
          ? 'inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:items-end justify-end sm:justify-start'
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 items-end'
      }`}
    >
      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 bg-black/40 sm:hidden cursor-default"
            onClick={() => setIsOpen(false)}
            aria-label={locale === 'EN' ? 'Close chat' : 'Sohbeti kapat'}
          />
          <div className="relative z-10 mx-3 mb-3 sm:mx-0 sm:mb-4 w-auto sm:w-80 md:w-96 max-h-[min(85vh,640px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-scale-in origin-bottom-right flex-1 sm:flex-none min-h-0">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="bg-white/20 p-2 rounded-xl shrink-0">
                    <Bot size={22} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate">{t('chat.title')}</h3>
                    <p className="text-xs text-indigo-100 truncate">{t('chat.subtitle')}</p>
                    <p className="text-xs text-indigo-100/90 flex items-center gap-1.5 flex-wrap mt-0.5">
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
              <p className="mt-2 text-[11px] text-indigo-100/90 leading-snug">
                {t('chat.privacyNote')}{' '}
                <Link to="/legal/privacy" className="underline font-semibold hover:text-white">
                  {t('chat.privacyLink')}
                </Link>
              </p>
            </div>

            <div className="flex-1 min-h-[12rem] sm:flex-none sm:h-80 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                      <Bot size={14} className="text-indigo-600 dark:text-indigo-400" aria-hidden />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
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
                <div className="flex justify-start items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-indigo-600 dark:text-indigo-400" aria-hidden />
                  </div>
                  <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {isGuest && quickReplies?.length > 0 && (
              <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
                {quickReplies.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => dispatchMessage(chip.message)}
                    disabled={isTyping}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            {isGuest && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-100 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
                <span>{t('chat.guestHint')}</span>
                <button
                  type="button"
                  onClick={handleLogin}
                  className="shrink-0 font-bold text-indigo-700 dark:text-indigo-300 hover:underline"
                >
                  {t('chat.loginCta')}
                </button>
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
        </>
      )}

      <div className="relative z-20 self-end mr-3 mb-3 sm:mr-0 sm:mb-0 flex flex-col items-end gap-2">
        {!isOpen && (
          <span className="hidden sm:block text-xs font-bold text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm opacity-0 group-hover:opacity-100 pointer-events-none">
            {t('chat.fabLabel')}
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`group flex items-center gap-2 transition-all duration-300 ${
            isOpen
              ? 'w-14 h-14 min-h-[56px] min-w-[56px] rounded-full bg-slate-800 justify-center'
              : 'pl-4 pr-5 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 shadow-lg hover:shadow-indigo-500/30'
          }`}
          aria-label={isOpen ? (locale === 'EN' ? 'Close assistant' : 'Asistanı kapat') : t('chat.title')}
        >
          {isOpen ? (
            <X size={24} className="text-white" />
          ) : (
            <>
              <Bot size={24} className="text-white shrink-0" aria-hidden />
              <span className="text-white text-sm font-bold hidden sm:inline">{t('chat.fabLabel')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Chatbox;
