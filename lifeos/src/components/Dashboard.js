import React, { useState, useEffect, useCallback } from 'react';
import { HABITS, getTodayLogs, getStreaks, getTodayBriefing, saveAIBriefing } from '../lib/supabase';
import { generateDailyBriefing } from '../lib/groq';

function useTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function getGreeting(h) {
  if (h < 5) return 'Still up?';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Late night grind';
}

export default function Dashboard({ onNavigate }) {
  const time = useTime();
  const [todayLogs, setTodayLogs] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [briefing, setBriefing] = useState('');
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [logs, streakData, savedBriefing] = await Promise.all([
        getTodayLogs(),
        getStreaks(),
        getTodayBriefing(),
      ]);
      setTodayLogs(logs);
      setStreaks(streakData);
      if (savedBriefing?.content) {
        setBriefing(savedBriefing.content);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleGenerateBriefing() {
    if (briefing || loadingBriefing) { setBriefingOpen(o => !o); return; }
    setLoadingBriefing(true);
    setBriefingOpen(true);
    try {
      const text = await generateDailyBriefing({ streaks, todayLogs });
      setBriefing(text);
      await saveAIBriefing(text);
    } catch (e) {
      setBriefing('Could not generate briefing right now.');
    } finally {
      setLoadingBriefing(false);
    }
  }

  const loggedIds = new Set(todayLogs.map(l => l.habit_id));
  const done = HABITS.filter(h => loggedIds.has(h.id)).length;
  const total = HABITS.length;
  const pct = Math.round((done / total) * 100);

  const h = time.getHours();
  const greeting = getGreeting(h);
  const dayStr = time.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const circumference = 2 * Math.PI * 26;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Mono:wght@300;400&family=Syne:wght@600;700;800&display=swap');

        .dash {
          width: 100%;
          min-height: 100vh;
          background: #0c0c0c;
          color: #e8e3da;
          padding: 0 0 110px;
          position: relative;
          font-family: 'Syne', sans-serif;
          display: grid;
          grid-template-columns: 320px 1fr;
          grid-template-rows: auto;
          align-items: start;
        }

        .dash-glow {
          position: fixed;
          top: -200px;
          left: 0;
          width: 600px;
          height: 500px;
          background: radial-gradient(ellipse, rgba(200,169,90,0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* LEFT COLUMN */
        .d-left {
          grid-column: 1;
          grid-row: 1 / 99;
          padding: 52px 36px 40px;
          border-right: 1px solid #141414;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          gap: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }

        /* RIGHT COLUMN */
        .d-right {
          grid-column: 2;
          padding: 52px 48px 40px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* HEADER */
        .d-header {
          margin-bottom: 36px;
          animation: fadeUp 0.5s 0.05s both;
        }

        .d-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .d-date {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 0.12em;
          color: #444;
          text-transform: uppercase;
        }

        .d-time {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: #C8A95A;
          letter-spacing: 0.05em;
        }

        .d-greeting {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          color: #3a3a3a;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .d-name {
          font-size: 44px;
          font-weight: 800;
          color: #e8e3da;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .d-name span { color: #C8A95A; }

        /* MISSION */
        .d-mission {
          background: #111;
          border: 1px solid #1c1c1c;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 18px;
          position: relative;
          overflow: hidden;
          margin-bottom: 12px;
          animation: fadeUp 0.5s 0.12s both;
        }

        .d-mission::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(200,169,90,0.04) 0%, transparent 60%);
          pointer-events: none;
        }

        .d-ring { position: relative; flex-shrink: 0; }
        .d-ring svg { transform: rotate(-90deg); display: block; }
        .ring-track { fill: none; stroke: #1e1e1e; stroke-width: 3; }
        .ring-fill {
          fill: none;
          stroke-width: 3;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1), stroke 0.4s;
        }
        .ring-num {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: #C8A95A;
        }

        .d-mission-text { flex: 1; }

        .d-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.22em;
          color: #333;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .d-mission-title {
          font-size: 17px;
          font-weight: 700;
          color: #e8e3da;
          line-height: 1.2;
          margin-bottom: 2px;
        }

        .d-mission-sub {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #333;
          font-weight: 300;
        }

        .d-log-btn {
          display: block;
          width: 100%;
          padding: 13px;
          background: #C8A95A;
          color: #0c0c0c;
          border: none;
          border-radius: 11px;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          margin-bottom: 12px;
          animation: fadeUp 0.5s 0.15s both;
        }

        .d-log-btn:hover { opacity: 0.88; }
        .d-log-btn:active { transform: scale(0.98); }

        .d-all-done {
          text-align: center;
          padding: 10px 0 12px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 300;
          color: #C8A95A;
          letter-spacing: 0.03em;
          animation: fadeUp 0.4s both;
        }

        /* QUICK STATS in left col */
        .d-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: auto;
          padding-top: 24px;
          animation: fadeUp 0.5s 0.26s both;
        }

        .d-stat {
          background: #0f0f0f;
          border: 1px solid #171717;
          border-radius: 12px;
          padding: 16px;
          transition: border-color 0.2s;
        }

        .d-stat:hover { border-color: #202020; }

        .d-stat-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px;
          font-weight: 500;
          color: #e8e3da;
          line-height: 1;
          margin-bottom: 4px;
        }

        .d-stat-val span {
          font-size: 14px;
          font-weight: 300;
          color: #2e2e2e;
        }

        .d-stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.18em;
          color: #2a2a2a;
          text-transform: uppercase;
        }

        /* SECTION LABEL */
        .d-section {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.25em;
          color: #2a2a2a;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        /* HABITS in right col */
        .d-habits {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 40px;
          animation: fadeUp 0.5s 0.19s both;
        }

        .d-habit {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 14px;
          border-radius: 14px;
          cursor: default;
          position: relative;
          transition: background 0.15s;
        }

        .d-habit::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 0;
          border-radius: 1px;
          transition: height 0.3s cubic-bezier(0.4,0,0.2,1);
          background: var(--hc);
        }

        .d-habit:hover { background: #111; }
        .d-habit:hover::before { height: 55%; }
        .d-habit.logged { opacity: 0.35; }

        .d-habit-icon {
          font-size: 20px;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #111;
          border: 1px solid #1c1c1c;
          flex-shrink: 0;
        }

        .d-habit-info { flex: 1; }

        .d-habit-name {
          font-size: 16px;
          font-weight: 600;
          color: #d8d3ca;
          letter-spacing: -0.01em;
        }

        .d-habit-streak {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 300;
          margin-top: 3px;
        }

        .d-habit-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .d-streak-num {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          min-width: 28px;
          text-align: right;
        }

        .d-check {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1.5px solid #1e1e1e;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .d-check.checked {
          background: color-mix(in srgb, var(--hc) 15%, transparent);
          border-color: color-mix(in srgb, var(--hc) 50%, transparent);
        }

        .d-check svg { opacity: 0; transition: opacity 0.2s; }
        .d-check.checked svg { opacity: 1; }

        /* DIVIDER */
        .d-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #161616 30%, #161616 70%, transparent);
          margin-bottom: 32px;
        }

        /* BRIEFING in right col */
        .d-briefing {
          border: 1px solid #161616;
          border-radius: 16px;
          overflow: hidden;
          background: #0e0e0e;
          animation: fadeUp 0.5s 0.33s both;
        }

        .d-briefing-head {
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: background 0.15s;
        }

        .d-briefing-head:hover { background: #111; }

        .d-briefing-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .d-aria-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #C8A95A;
          box-shadow: 0 0 10px rgba(200,169,90,0.5);
          animation: ariaPulse 2s ease-in-out infinite;
        }

        @keyframes ariaPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        .d-briefing-lbl {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          color: #3a3a3a;
          text-transform: uppercase;
        }

        .d-briefing-action {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #2e2e2e;
          transition: color 0.2s;
        }

        .d-briefing-head:hover .d-briefing-action { color: #555; }

        .d-briefing-body {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1);
        }

        .d-briefing-body.open { max-height: 400px; }

        .d-briefing-inner {
          padding: 0 22px 24px;
          border-top: 1px solid #161616;
        }

        .d-briefing-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 300;
          color: #666;
          line-height: 1.65;
          letter-spacing: 0.01em;
          padding-top: 18px;
        }

        .d-briefing-loading {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #333;
          padding-top: 18px;
          letter-spacing: 0.1em;
          animation: ariaPulse 1.5s ease-in-out infinite;
        }

        /* SKELETON */
        .d-skeleton {
          background: linear-gradient(90deg, #111 25%, #181818 50%, #111 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
          height: 16px;
          margin-bottom: 8px;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="dash">
        <div className="dash-glow" />

        {/* ── LEFT COLUMN ── */}
        <div className="d-left">

          {/* HEADER */}
          <div className="d-header">
            <div className="d-meta">
              <span className="d-date">{dayStr}</span>
              <span className="d-time">{timeStr}</span>
            </div>
            <div className="d-greeting">{greeting},</div>
            <div className="d-name">Shubho<span>.</span></div>
          </div>

          {/* MISSION RING */}
          <div className="d-mission">
            <div className="d-ring">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle className="ring-track" cx="32" cy="32" r="26" />
                <circle
                  className="ring-fill"
                  cx="32" cy="32" r="26"
                  strokeDasharray={circumference}
                  strokeDashoffset={loading ? circumference : offset}
                  stroke={pct === 100 ? '#5BEF8C' : '#C8A95A'}
                />
              </svg>
              <div className="ring-num">{pct}%</div>
            </div>
            <div className="d-mission-text">
              <div className="d-eyebrow">Today's mission</div>
              <div className="d-mission-title">
                {loading ? '—'
                  : done === total ? 'All locked in.'
                  : `${total - done} habit${total - done > 1 ? 's' : ''} remaining`}
              </div>
              <div className="d-mission-sub">{done}/{total} complete</div>
            </div>
          </div>

          {!loading && done < total && (
            <button className="d-log-btn" onClick={() => onNavigate('log')}>
              Log habits →
            </button>
          )}

          {!loading && done === total && (
            <div className="d-all-done">All done. Locked in. 🔒</div>
          )}

          {/* QUICK STATS */}
          <div className="d-stats">
            <div className="d-stat">
              <div className="d-stat-val">
                {Object.values(streaks).filter(s => s > 0).length}
                <span> active</span>
              </div>
              <div className="d-stat-label">Streaks running</div>
            </div>
            <div className="d-stat">
              <div className="d-stat-val">
                {Math.max(0, ...Object.values(streaks))}
                <span>d</span>
              </div>
              <div className="d-stat-label">Best streak</div>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="d-right">

          {/* STREAKS */}
          <div className="d-section">Streaks</div>
          <div className="d-habits">
            {loading
              ? [1,2,3,4,5].map(i => (
                  <div key={i} style={{ padding: '16px 14px' }}>
                    <div className="d-skeleton" style={{ width: `${55 + i * 9}%` }} />
                  </div>
                ))
              : HABITS.map(habit => {
                  const streak = streaks[habit.id] || 0;
                  const logged = loggedIds.has(habit.id);
                  return (
                    <div
                      key={habit.id}
                      className={`d-habit${logged ? ' logged' : ''}`}
                      style={{ '--hc': streak > 0 ? habit.color : '#2a2a2a' }}
                    >
                      <div className="d-habit-icon">{habit.icon}</div>
                      <div className="d-habit-info">
                        <div className="d-habit-name">{habit.label}</div>
                        <div className="d-habit-streak" style={{ color: streak > 0 ? habit.color : '#2a2a2a' }}>
                          {streak > 0 ? `${streak} day streak` : 'Start today'}
                        </div>
                      </div>
                      <div className="d-habit-right">
                        <div className="d-streak-num" style={{ color: streak > 0 ? habit.color : '#2a2a2a' }}>
                          {streak > 0 ? `${streak}d` : '—'}
                        </div>
                        <div className={`d-check${logged ? ' checked' : ''}`} style={{ '--hc': habit.color }}>
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke={habit.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  );
                })
            }
          </div>

          <div className="d-divider" />

          {/* BRIEFING */}
          <div className="d-section">Aria — Daily Briefing</div>
          <div className="d-briefing">
            <div className="d-briefing-head" onClick={handleGenerateBriefing}>
              <div className="d-briefing-left">
                <div className="d-aria-dot" />
                <span className="d-briefing-lbl">Today's briefing</span>
              </div>
              <span className="d-briefing-action">
                {briefingOpen ? '↑ close' : briefing ? '↓ read' : '↓ generate'}
              </span>
            </div>
            <div className={`d-briefing-body${briefingOpen ? ' open' : ''}`}>
              <div className="d-briefing-inner">
                {loadingBriefing
                  ? <div className="d-briefing-loading">Aria is thinking...</div>
                  : <div className="d-briefing-text">{briefing}</div>
                }
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
