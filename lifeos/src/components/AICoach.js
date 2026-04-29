import React, { useState, useEffect, useRef } from 'react';
import { getChatHistory, saveMessage, getStreaks, getTodayLogs, getRecentLogs } from '../lib/supabase';
import { callGroq, buildSystemPrompt } from '../lib/groq';
import { HABITS } from '../lib/supabase';
import './AICoach.css';

const QUICK_PROMPTS = [
  'Read my week — be honest',
  'Give me today\'s battle plan',
  'What am I slipping on?',
  'Business idea brainstorm',
  'Roast my consistency',
  'How do I level up faster?',
];

export default function AICoach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadContext();
    getChatHistory(20).then(setMessages).catch(console.error);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadContext() {
    try {
      const [streaks, todayLogs, recentLogs] = await Promise.all([
        getStreaks(), getTodayLogs(), getRecentLogs(7)
      ]);
      setContext({ streaks, todayLogs, recentLogs });
    } catch (err) { console.error(err); }
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      await saveMessage('user', text);
      const systemPrompt = context
        ? buildSystemPrompt(context.streaks, context.todayLogs, context.recentLogs, HABITS)
        : 'You are ARIA, an elite AI life coach. Be direct, sharp, and motivating.';

      const history = [...messages, userMsg].slice(-10).map(m => ({ role: m.role, content: m.content }));
      const reply = await callGroq(history, systemPrompt);

      const assistantMsg = { role: 'assistant', content: reply };
      setMessages(prev => [...prev, assistantMsg]);
      await saveMessage('assistant', reply);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'ARIA offline right now. Check your Groq API key.' }]);
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
          <span className="coach-role">AI LIFE COACH</span>
        </div>
      </div>

      {/* Messages */}
      <div className="coach-messages">
        {messages.length === 0 && (
          <div className="coach-empty animate-fadeup">
            <div className="coach-empty-icon">◆</div>
            <div className="coach-empty-title">ARIA IS READY</div>
            <div className="coach-empty-sub">Ask me anything. I know your stats.</div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`msg msg--${m.role} animate-fadeup`}>
            {m.role === 'assistant' && <span className="msg-label">ARIA</span>}
            <div className="msg-bubble">
              <p className="msg-text">{m.content}</p>
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
          {QUICK_PROMPTS.map(p => (
            <button key={p} className="quick-btn" onClick={() => sendMessage(p)}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="coach-input-row">
        <input
          className="coach-input"
          placeholder="Talk to ARIA..."
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
