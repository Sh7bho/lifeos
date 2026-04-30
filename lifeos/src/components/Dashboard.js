import React, { useState, useEffect } from 'react';
import { getTodayLogs, getStreaks, getRecentLogs, getTodayBriefing, saveAIBriefing, HABITS } from '../lib/supabase';
import { generateDailyBriefing } from '../lib/groq';
import FlipClock from './FlipClock';
import './Dashboard.css';

function StreakBadge({ habit, streak, logged }) {
  return (
    <div className={`streak-badge ${logged ? 'streak-badge--done' : ''}`} style={{ '--accent': habit.color }}>
      <span className="streak-icon">{habit.icon}</span>
      <span className="streak-label">{habit.label}</span>
      <span className="streak-count">{streak}d</span>
      {logged && <span className="streak-check">✓</span>}
    </div>
  );
}

function LiveClock({ onClick }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = String(time.getHours()).padStart(2, '0');
  const m = String(time.getMinutes()).padStart(2, '0');
  const s = String(time.getSeconds()).padStart(2, '0');
  return (
    <button className="live-clock" onClick={onClick} aria-label="Open flip clock">
      <span className="live-clock-time">{h}<span className="live-clock-sep">:</span>{m}<span className="live-clock-sep live-clock-sep--dim">:{s}</span></span>
    </button>
  );
}

function getGreeting(hour, name) {
  if (hour < 5)  return { text: `Up this late, ${name}? 👀`, sub: 'The grind never sleeps.' };
  if (hour < 12) return { text: `Rise & grind, ${name} 🔥`, sub: "Morning energy. Lock in." };
  if (hour < 14) return { text: `What's good, ${name} 👑`, sub: 'Mid-day check-in. Stay sharp.' };
  if (hour < 17) return { text: `Still crushing it, ${name} 💪`, sub: 'Afternoon. Finish what you started.' };
  if (hour < 20) return { text: `Evening, boss ${name} 🌆`, sub: 'Wind down strong.' };
  return { text: `Night mode, ${name} 🌙`, sub: 'Rest is part of the grind.' };
}

/**
 * Checks whether a → action line has been completed.
 * Matches any HABIT label appearing in the line text (case-insensitive).
 */
function isActionDone(line, todayLogs) {
  const lower = line.toLowerCase();
  return HABITS.some(h => {
    if (!lower.includes(h.label.toLowerCase())) return false;
    return todayLogs.some(l => l.habit_id === h.id);
  });
}

/**
 * Renders the briefing text with smart → action lines.
 * Action lines that mention a logged habit get a strikethrough + ✓ badge.
 * Plain text lines render normally.
 */
function BriefingText({ text, todayLogs }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="aria-text">
      {lines.map((line, i) => {
        const isAction = line.trimStart().startsWith('→');
        if (!isAction) {
          return (
            <p key={i} className="briefing-line briefing-line--plain">
              {line}
            </p>
          );
        }

        const done = isActionDone(line, todayLogs);
        return (
          <div key={i} className={`briefing-action ${done ? 'briefing-action--done' : ''}`}>
            <span className="briefing-arrow">→</span>
            <span className="briefing-action-text">
              {line.replace(/^→\s*/, '')}
            </span>
            {done && <span className="briefing-done-badge">✓ DONE</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard({ onNavigate, onRefresh }) {
  const [todayLogs, setTodayLogs] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [briefing, setBriefing] = useState('');
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFlipClock, setShowFlipClock] = useState(false);

  const now = new Date();
  const hour = now.getHours();
  const { text: greetingText, sub: greetingSub } = getGreeting(hour, 'Shubho');
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const dayName = days[now.getDay()];
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });

  useEffect(() => { loadData(); }, []);

  async function loadData(forceNewBriefing = false) {
    try {
      const [logs, streakData, existingBriefing, recentLogs] = await Promise.all([
        getTodayLogs(), getStreaks(), getTodayBriefing(), getRecentLogs(7),
      ]);
      setTodayLogs(logs);
      setStreaks(streakData);

      if (existingBriefing && !forceNewBriefing) {
        setBriefing(existingBriefing.content);
      } else {
        generateBriefing(streakData, logs, recentLogs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function generateBriefing(streakData, logs, recentLogs) {
    setBriefingLoading(true);
    try {
      const content = await generateDailyBriefing(streakData, logs, recentLogs, HABITS);
      setBriefing(content);
      await saveAIBriefing(content);
    } catch (err) {
      setBriefing('ARIA offline. Log your habits and check back later.');
    } finally {
      setBriefingLoading(false);
    }
  }

  // Called when user returns from logging — refresh logs only (keep today's briefing text)
  async function handleRefreshAfterLog() {
    try {
      const [logs, streakData] = await Promise.all([getTodayLogs(), getStreaks()]);
      setTodayLogs(logs);
      setStreaks(streakData);
    } catch (err) {
      console.error(err);
    }
  }

  const doneCount = todayLogs.length;
  const totalHabits = HABITS.length;
  const pct = Math.round((doneCount / totalHabits) * 100);

  if (loading) return (
    <div className="page dash-loading"><div className="spinner" /></div>
  );

  return (
    <>
      {showFlipClock && <FlipClock onClose={() => setShowFlipClock(false)} />}
      <div className="page">
        <div className="dash-header animate-fadeup">
          <div className="dash-header-row">
            <div className="dash-date">
              <span className="dash-dayname">{dayName}</span>
              <span className="dash-datestr">{dateStr}</span>
            </div>
            <LiveClock onClick={() => setShowFlipClock(true)} />
          </div>
          <div className="dash-greeting">{greetingText}</div>
          <div className="dash-tagline">{greetingSub}</div>
        </div>

        <div className="dash-progress-wrap animate-fadeup-1">
          <div className="progress-ring-container">
            <svg viewBox="0 0 100 100" className="progress-ring">
              <circle cx="50" cy="50" r="40" className="ring-bg" />
              <circle
                cx="50" cy="50" r="40"
                className="ring-fill"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
              />
            </svg>
            <div className="progress-inner">
              <span className="progress-pct">{pct}<span className="progress-sym">%</span></span>
              <span className="progress-sub">{doneCount}/{totalHabits} done</span>
            </div>
          </div>
          <div className="progress-label">
            <div className="progress-title">TODAY'S MISSION</div>
            <div className="progress-hint">
              {doneCount === totalHabits
                ? '🔥 Full send. All habits complete.'
                : `${totalHabits - doneCount} habit${totalHabits - doneCount > 1 ? 's' : ''} left to lock in.`}
            </div>
            <button className="btn btn-primary log-now-btn" onClick={() => onNavigate('log')}>
              LOG NOW →
            </button>
          </div>
        </div>

        <div className="card animate-fadeup-2">
          <div className="card-label">STREAKS</div>
          <div className="streak-grid">
            {HABITS.map(h => (
              <StreakBadge
                key={h.id}
                habit={h}
                streak={streaks[h.id] || 0}
                logged={todayLogs.some(l => l.habit_id === h.id)}
              />
            ))}
          </div>
        </div>

        <div className="card aria-card animate-fadeup-3">
          <div className="aria-header">
            <span className="aria-dot" />
            <span className="card-label">ARIA — DAILY BRIEFING</span>
            <button
              className="briefing-refresh-btn"
              onClick={() => loadData(true)}
              disabled={briefingLoading}
              title="Refresh briefing"
            >↺</button>
          </div>
          {briefingLoading ? (
            <div className="aria-loading">
              <div className="spinner" />
              <span>ARIA is reading your stats...</span>
            </div>
          ) : (
            <BriefingText text={briefing} todayLogs={todayLogs} />
          )}
          <button className="btn btn-ghost aria-chat-btn" onClick={() => onNavigate('coach')}>
            TALK TO ARIA →
          </button>
        </div>
      </div>
    </>
  );
}
