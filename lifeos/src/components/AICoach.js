import React, { useState, useEffect, useRef } from 'react';
import {
  getChatHistory,
  saveMessage,
  getStreaks,
  getTodayLogs,
  getRecentLogs,
  HABITS,
} from '../lib/supabase';
import { callGroq, buildSystemPrompt } from '../lib/groq';
import './AICoach.css';

const QUICK_PROMPTS = [
  'Audit my discipline',
  "Build today's execution plan",
  'Where am I wasting potential?',
  'Give me a money move',
  'Roast my excuses',
  'Upgrade my mindset',
];

// Keys used in sessionStorage
const SESSION_ID_KEY = 'aria_session_id';      // ID of the current active session
const NEW_CHAT_ID_KEY = 'aria_new_chat_id';    // ID set when "New Chat" is clicked
const SESSION_MSGS_KEY = 'aria_session_msgs';  // In-memory messages for current session

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function AICoach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);

  // true  → this is a "new chat" session; don't load or save to Supabase history
  // false → normal session; load history from Supabase and persist new messages
  const isNewChatRef = useRef(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    loadContext();

    const newChatId = sessionStorage.getItem(NEW_CHAT_ID_KEY);
    const currentSessionId = sessionStorage.getItem(SESSION_ID_KEY);

    if (newChatId) {
      // "New Chat" was clicked — this is a fresh session.
      // Promote the new-chat ID to be the active session ID.
      isNewChatRef.current = true;
      sessionStorage.setItem(SESSION_ID_KEY, newChatId);
      sessionStorage.removeItem(NEW_CHAT_ID_KEY);
      sessionStorage.removeItem(SESSION_MSGS_KEY);
      setMessages([]);
    } else if (currentSessionId) {
      // Existing session (refresh / tab switch / remount) — restore in-memory messages.
      // Do NOT call Supabase — keep only what happened in this session visible.
      isNewChatRef.current = true; // treat as new chat (don't pull Supabase history)
      const saved = sessionStorage.getItem(SESSION_MSGS_KEY);
      if (saved) {
        try { setMessages(JSON.parse(saved)); } catch { setMessages([]); }
      }
    } else {
      // Very first load ever (no session yet) — load Supabase history normally.
      isNewChatRef.current = false;
      const freshId = generateId();
      sessionStorage.setItem(SESSION_ID_KEY, freshId);
      getChatHistory(20)
        .then(data => {
          const history = data || [];
          setMessages(history);
          sessionStorage.setItem(SESSION_MSGS_KEY, JSON.stringify(history));
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Keep sessionStorage in sync whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(SESSION_MSGS_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  async function loadContext() {
    try {
      const [streaks, todayLogs, recentLogs] = await Promise.all([
        getStreaks(), getTodayLogs(), getRecentLogs(7),
      ]);
      setContext({ streaks, todayLogs, recentLogs });
    } catch (err) { console.error(err); }
  }

  function getCurrentTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function clearChat() {
    // Generate a new session ID and store it under the "pending new chat" key.
    // On the next mount (or immediately below), this signals a fresh session.
    const newId = generateId();
    sessionStorage.setItem(NEW_CHAT_ID_KEY, newId);
    sessionStorage.removeItem(SESSION_MSGS_KEY);

    // Apply immediately without waiting for a remount
    isNewChatRef.current = true;
    sessionStorage.setItem(SESSION_ID_KEY, newId);
    sessionStorage.removeItem(NEW_CHAT_ID_KEY);
    setMessages([]);
  }

  const systemPrompt = context
    ? buildSystemPrompt(context.streaks, context.todayLogs, context.recentLogs, HABITS)
    : `You are ARIA — Shubho's elite AI strategist, execution coach, and ruthless accountability partner.
Naturally address him as "Shubho", "Boss", or "Chief" depending on tone.
Be direct, tactical, strategic, sharp, and high-performance focused.
Never sound generic, robotic, or soft. Prioritize discipline, execution, wealth-building, focus, and self-mastery.`;

  async function sendMessage(text) {
    if (!text?.trim() || loading) return;
    const cleanText = text.trim();
    const userMsg = { role: 'user', content: cleanText, time: getCurrentTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (!isNewChatRef.current) await saveMessage('user', cleanText);

      const history = [...messages, userMsg]
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const reply = await callGroq(history, systemPrompt);
      const assistantMsg = {
        role: 'assistant',
        content: reply || 'Boss, no response came through. Check the system.',
        time: getCurrentTime(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      if (!isNewChatRef.current) await saveMessage('assistant', assistantMsg.content);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection unstable, Boss. Check your API setup.',
        time: getCurrentTime(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="coach-wrap">
      <div className="coach-header">
        <div className="coach-title-row">
          <span className="aria-status-dot" />
          <span className="coach-name">ARIA</span>
          <span className="coach-role">SHUBHO'S PERSONAL ASSISTANT</span>
          <button className="clear-chat-btn" onClick={clearChat} disabled={loading}>
            New Chat
          </button>
        </div>
      </div>

      <div className="coach-messages">
        {messages.length === 0 && (
          <div className="coach-empty animate-fadeup">
            <div className="coach-empty-icon">◆</div>
            <div className="coach-empty-title">WELCOME BACK, SHUBHO</div>
            <div className="coach-empty-sub">
              Discipline. Strategy. Execution.<br />
              Your patterns are already being analyzed.
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`msg msg--${message.role} animate-fadeup`}>
            {message.role === 'assistant' && <span className="msg-label">ARIA</span>}
            <div className="msg-bubble">
              <p className="msg-text">
                {(message.content || '').split('\n').map((line, i) => (
                  <React.Fragment key={i}>{line}<br /></React.Fragment>
                ))}
              </p>
              {message.time && <div className="msg-time">{message.time}</div>}
            </div>
          </div>
        ))}

        {loading && (
          <div className="msg msg--assistant">
            <span className="msg-label">ARIA</span>
            <div className="msg-bubble msg-bubble--loading">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length < 2 && (
        <div className="quick-prompts">
          {QUICK_PROMPTS.map(prompt => (
            <button key={prompt} className="quick-btn" onClick={() => sendMessage(prompt)} disabled={loading}>
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="coach-input-row">
        <input
          className="coach-input"
          placeholder="Your move, Boss..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          disabled={loading}
        />
        <button
          className={`send-btn ${loading ? 'send-btn--loading' : ''}`}
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '→'}
        </button>
      </div>
    </div>
  );
}
