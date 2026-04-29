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
  'Build today’s execution plan',
  'Where am I wasting potential?',
  'Give me a money move',
  'Roast my excuses',
  'Upgrade my mindset',
];

export default function AICoach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadContext();

    getChatHistory(20)
      .then(data => {
        if (!sessionStorage.getItem('chatCleared')) {
          setMessages(data || []);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: messages.length > 3 ? 'smooth' : 'auto',
    });
  }, [messages]);

  async function loadContext() {
    try {
      const [streaks, todayLogs, recentLogs] = await Promise.all([
        getStreaks(),
        getTodayLogs(),
        getRecentLogs(7),
      ]);

      setContext({
        streaks,
        todayLogs,
        recentLogs,
      });
    } catch (err) {
      console.error(err);
    }
  }

  function getCurrentTime() {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function clearChat() {
    sessionStorage.setItem('chatCleared', 'true');
    setMessages([]);
  }

  async function sendMessage(text) {
    if (!text?.trim() || loading) return;

    const cleanText = text.trim();

    // Once user starts again, allow fresh history next session
    sessionStorage.removeItem('chatCleared');

    const userMsg = {
      role: 'user',
      content: cleanText,
      time: getCurrentTime(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      await saveMessage('user', cleanText);

      const systemPrompt = context
        ? buildSystemPrompt(
            context.streaks,
            context.todayLogs,
            context.recentLogs,
            HABITS
          )
        : `You are ARIA — Shubho's elite AI strategist, execution coach, and ruthless accountability partner.

USER IDENTITY:
- The user's name is Shubho.
- Naturally address him as "Shubho", "Boss", or "Chief" depending on tone.
- Use "Boss" for tactical execution.
- Use "Shubho" for personal insight.
- Use "Chief" for strategic motivation.
- Never overuse one title repeatedly.

CORE PERSONALITY:
- Direct
- Tactical
- Strategic
- Sharp
- High-performance focused

RULES:
- Never sound generic, robotic, childish, or overly soft.
- Be concise, elite, and psychologically aware.
- Prioritize discipline, execution, wealth-building, focus, and self-mastery.
- Call out excuses immediately.
- Your purpose is to upgrade Shubho.`;

      const history = [...messages, userMsg]
        .slice(-10)
        .map(message => ({
          role: message.role,
          content: message.content,
        }));

      const reply = await callGroq(history, systemPrompt);

      const assistantMsg = {
        role: 'assistant',
        content: reply || 'Boss, no response came through. Check the system.',
        time: getCurrentTime(),
      };

      setMessages(prev => [...prev, assistantMsg]);

      await saveMessage('assistant', assistantMsg.content);
    } catch (err) {
      console.error(err);

      const errorMsg = {
        role: 'assistant',
        content:
          'Connection unstable, Boss. Even elite systems need recalibration. Check your API setup.',
        time: getCurrentTime(),
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="coach-wrap">
      {/* Header */}
      <div className="coach-header">
        <div className="coach-title-row">
          <span className="aria-status-dot" />
          <span className="coach-name">ARIA</span>
          <span className="coach-role">EXECUTION SYSTEM</span>

          <button
            className="clear-chat-btn"
            onClick={clearChat}
            disabled={loading}
          >
            New Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="coach-messages">
        {messages.length === 0 && (
          <div className="coach-empty animate-fadeup">
            <div className="coach-empty-icon">◆</div>
            <div className="coach-empty-title">WELCOME BACK, SHUBHO</div>
            <div className="coach-empty-sub">
              Discipline. Strategy. Execution.
              <br />
              Your patterns are already being analyzed.
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`msg msg--${message.role} animate-fadeup`}
          >
            {message.role === 'assistant' && (
              <span className="msg-label">ARIA</span>
            )}

            <div className="msg-bubble">
              <p className="msg-text">
                {(message.content || '').split('\n').map((line, lineIndex) => (
                  <React.Fragment key={lineIndex}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </p>

              {message.time && (
                <div className="msg-time">{message.time}</div>
              )}
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

      {/* Quick prompts */}
      {messages.length < 2 && (
        <div className="quick-prompts">
          {QUICK_PROMPTS.map(prompt => (
            <button
              key={prompt}
              className="quick-btn"
              onClick={() => sendMessage(prompt)}
              disabled={loading}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="coach-input-row">
        <input
          className="coach-input"
          placeholder="Your move, Boss..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              sendMessage(input);
            }
          }}
          disabled={loading}
        />

        <button
          className={`send-btn ${loading ? 'send-btn--loading' : ''}`}
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <span
              className="spinner"
              style={{ width: 16, height: 16 }}
            />
          ) : (
            '→'
          )}
        </button>
      </div>
    </div>
  );
}
