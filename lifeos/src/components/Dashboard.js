import { useState, useEffect } from "react";

const HABITS = [
  { id: 1, icon: "💪", label: "Gym", streak: 2, color: "#E8C547", done: false },
  { id: 2, icon: "💻", label: "Coding", streak: 0, color: "#5B8DEF", done: false },
  { id: 3, icon: "📈", label: "Business", streak: 0, color: "#EF8C5B", done: false },
  { id: 4, icon: "📚", label: "Learning", streak: 2, color: "#5BEF8C", done: false },
  { id: 5, icon: "🎓", label: "BCA", streak: 0, color: "#C45BEF", done: false },
];

const BRIEFING = "You're 2 days into your gym streak. Coding and Business haven't been touched — today's the day to change that. Finish what you started this week.";

function useTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function getGreeting(h) {
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Late night grind";
}

export default function Dashboard() {
  const time = useTime();
  const [habits, setHabits] = useState(HABITS);
  const [expanded, setExpanded] = useState(null);
  const [briefingOpen, setBriefingOpen] = useState(false);

  const done = habits.filter(h => h.done).length;
  const total = habits.length;
  const pct = Math.round((done / total) * 100);

  const h = time.getHours();
  const greeting = getGreeting(h);
  const dayStr = time.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const timeStr = time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  function toggleHabit(id) {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
  }

  const circumference = 2 * Math.PI * 26;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Mono:wght@300;400&family=Syne:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body, #root {
          background: #0c0c0c;
          min-height: 100vh;
          font-family: 'Syne', sans-serif;
        }

        .dash {
          max-width: 480px;
          margin: 0 auto;
          min-height: 100vh;
          background: #0c0c0c;
          color: #e8e3da;
          padding: 0 0 100px;
          position: relative;
          overflow: hidden;
        }

        /* Ambient glow */
        .dash::before {
          content: '';
          position: fixed;
          top: -180px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(200,165,90,0.07) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        /* ── HEADER ── */
        .header {
          padding: 48px 28px 0;
          position: relative;
          z-index: 1;
        }

        .header-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .date-chip {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 0.12em;
          color: #666;
          text-transform: uppercase;
        }

        .time-display {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 400;
          color: #C8A95A;
          letter-spacing: 0.05em;
        }

        .greeting {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          font-weight: 400;
          color: #555;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .headline {
          font-family: 'Syne', sans-serif;
          font-size: 34px;
          font-weight: 800;
          color: #e8e3da;
          line-height: 1.05;
          letter-spacing: -0.02em;
        }

        .headline span {
          color: #C8A95A;
        }

        /* ── MISSION RING ── */
        .mission-block {
          margin: 32px 28px 0;
          background: #131313;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 24px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .mission-block:hover {
          border-color: #2a2a2a;
        }

        .mission-block::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(200,169,90,0.03) 0%, transparent 60%);
          pointer-events: none;
        }

        .ring-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .ring-wrap svg {
          transform: rotate(-90deg);
        }

        .ring-track { fill: none; stroke: #1e1e1e; stroke-width: 3; }
        .ring-fill {
          fill: none;
          stroke: #C8A95A;
          stroke-width: 3;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1);
        }

        .ring-label {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 400;
          color: #C8A95A;
        }

        .mission-text { flex: 1; }

        .mission-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          color: #444;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .mission-title {
          font-size: 17px;
          font-weight: 700;
          color: #e8e3da;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .mission-sub {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #444;
          font-weight: 300;
        }

        .log-btn {
          margin-top: 14px;
          width: 100%;
          padding: 13px;
          background: #C8A95A;
          color: #0c0c0c;
          border: none;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
        }

        .log-btn:hover { opacity: 0.9; }
        .log-btn:active { transform: scale(0.98); }

        /* ── SECTION LABEL ── */
        .section-label {
          padding: 28px 28px 12px;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.25em;
          color: #333;
          text-transform: uppercase;
        }

        /* ── HABITS ── */
        .habits-list {
          padding: 0 28px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .habit-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.15s;
          position: relative;
          overflow: hidden;
        }

        .habit-row:hover { background: #131313; }

        .habit-row.done-row {
          opacity: 0.45;
        }

        .habit-row::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 2px;
          height: 0;
          border-radius: 1px;
          transition: height 0.3s cubic-bezier(0.4,0,0.2,1);
        }

        .habit-row:hover::before,
        .habit-row.done-row::before {
          height: 60%;
        }

        .habit-icon {
          font-size: 20px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #131313;
          border: 1px solid #1c1c1c;
          flex-shrink: 0;
          transition: border-color 0.2s;
        }

        .habit-row:hover .habit-icon {
          border-color: #2a2a2a;
        }

        .habit-info { flex: 1; }

        .habit-name {
          font-size: 15px;
          font-weight: 600;
          color: #d8d3ca;
          letter-spacing: -0.01em;
        }

        .habit-streak {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          font-weight: 300;
          margin-top: 2px;
        }

        .habit-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .streak-badge {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 400;
          min-width: 28px;
          text-align: right;
        }

        .check-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 1.5px solid #2a2a2a;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .check-circle.checked {
          border-color: transparent;
        }

        .check-circle svg {
          opacity: 0;
          transition: opacity 0.2s;
        }

        .check-circle.checked svg { opacity: 1; }

        /* ── DIVIDER ── */
        .divider {
          margin: 24px 28px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #1e1e1e 30%, #1e1e1e 70%, transparent);
        }

        /* ── BRIEFING ── */
        .briefing-block {
          margin: 0 28px;
          border: 1px solid #1a1a1a;
          border-radius: 16px;
          overflow: hidden;
          background: #111;
        }

        .briefing-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: background 0.15s;
        }

        .briefing-header:hover { background: #141414; }

        .briefing-label {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .aria-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #C8A95A;
          box-shadow: 0 0 8px rgba(200,169,90,0.6);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .briefing-title {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          color: #555;
          text-transform: uppercase;
        }

        .briefing-toggle {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #333;
          transition: color 0.2s;
        }

        .briefing-header:hover .briefing-toggle { color: #555; }

        .briefing-body {
          padding: 0 20px;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1), padding 0.3s;
        }

        .briefing-body.open {
          max-height: 200px;
          padding-bottom: 20px;
        }

        .briefing-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 300;
          color: #888;
          line-height: 1.6;
          letter-spacing: 0.01em;
          border-top: 1px solid #1a1a1a;
          padding-top: 16px;
        }

        /* ── QUICK STATS ── */
        .quick-stats {
          margin: 0 28px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .stat-card {
          background: #111;
          border: 1px solid #1a1a1a;
          border-radius: 14px;
          padding: 18px;
          transition: border-color 0.2s;
        }

        .stat-card:hover { border-color: #252525; }

        .stat-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-weight: 500;
          color: #e8e3da;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-value span {
          font-size: 16px;
          font-weight: 300;
          color: #444;
        }

        .stat-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.18em;
          color: #333;
          text-transform: uppercase;
        }

        /* ── COMPLETED STATE ── */
        .all-done {
          text-align: center;
          padding: 20px 28px 0;
        }

        .all-done-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 300;
          color: #C8A95A;
          letter-spacing: 0.03em;
        }

        /* ── FADE IN ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fade-1 { animation: fadeUp 0.5s 0.05s both; }
        .fade-2 { animation: fadeUp 0.5s 0.12s both; }
        .fade-3 { animation: fadeUp 0.5s 0.19s both; }
        .fade-4 { animation: fadeUp 0.5s 0.26s both; }
        .fade-5 { animation: fadeUp 0.5s 0.33s both; }
        .fade-6 { animation: fadeUp 0.5s 0.40s both; }
      `}</style>

      <div className="dash">

        {/* HEADER */}
        <div className="header fade-1">
          <div className="header-meta">
            <span className="date-chip">{dayStr}</span>
            <span className="time-display">{timeStr}</span>
          </div>
          <div className="greeting">{greeting},</div>
          <div className="headline">Shubho<span>.</span></div>
        </div>

        {/* MISSION */}
        <div className="mission-block fade-2">
          <div className="ring-wrap">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle className="ring-track" cx="32" cy="32" r="26" />
              <circle
                className="ring-fill"
                cx="32" cy="32" r="26"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ stroke: pct === 100 ? '#5BEF8C' : '#C8A95A' }}
              />
            </svg>
            <div className="ring-label">{pct}%</div>
          </div>
          <div className="mission-text">
            <div className="mission-eyebrow">Today's mission</div>
            <div className="mission-title">
              {done === total
                ? "All locked in."
                : `${total - done} habit${total - done > 1 ? 's' : ''} remaining`}
            </div>
            <div className="mission-sub">{done}/{total} complete</div>
          </div>
        </div>

        {done < total && (
          <div style={{ padding: '10px 28px 0' }} className="fade-2">
            <button className="log-btn" onClick={() => {}}>
              Log habits →
            </button>
          </div>
        )}

        {done === total && (
          <div className="all-done fade-2">
            <div className="all-done-text">All done. Locked in. 🔒</div>
          </div>
        )}

        {/* STREAKS */}
        <div className="section-label fade-3">Streaks</div>
        <div className="habits-list fade-3">
          {habits.map((habit, i) => (
            <div
              key={habit.id}
              className={`habit-row${habit.done ? ' done-row' : ''}`}
              style={{ '--accent': habit.color }}
              onClick={() => toggleHabit(habit.id)}
            >
              <style>{`
                .habit-row[style*="--accent: ${habit.color}"]::before { background: ${habit.color}; }
                .habit-row[style*="--accent: ${habit.color}"] .check-circle.checked { background: ${habit.color}20; border-color: ${habit.color}60; }
                .habit-row[style*="--accent: ${habit.color}"] .streak-badge { color: ${habit.streak > 0 ? habit.color : '#2e2e2e'}; }
                .habit-row[style*="--accent: ${habit.color}"] .habit-streak { color: ${habit.streak > 0 ? habit.color + '80' : '#2a2a2a'}; }
              `}</style>
              <div className="habit-icon">{habit.icon}</div>
              <div className="habit-info">
                <div className="habit-name">{habit.label}</div>
                <div className="habit-streak">
                  {habit.streak > 0 ? `${habit.streak} day streak` : 'Start today'}
                </div>
              </div>
              <div className="habit-right">
                <div className="streak-badge">
                  {habit.streak > 0 ? `${habit.streak}d` : '—'}
                </div>
                <div className={`check-circle${habit.done ? ' checked' : ''}`}
                  style={habit.done ? { borderColor: habit.color + '60', background: habit.color + '15' } : {}}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke={habit.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="divider fade-4" />

        {/* QUICK STATS */}
        <div className="quick-stats fade-4">
          <div className="stat-card">
            <div className="stat-value">
              {habits.filter(h => h.streak > 0).length}
              <span> active</span>
            </div>
            <div className="stat-label">Streaks running</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {Math.max(...habits.map(h => h.streak))}
              <span>d</span>
            </div>
            <div className="stat-label">Best streak</div>
          </div>
        </div>

        <div className="section-label fade-5" style={{ marginTop: 20 }}>Aria — Daily Briefing</div>

        {/* BRIEFING */}
        <div className="briefing-block fade-5">
          <div className="briefing-header" onClick={() => setBriefingOpen(o => !o)}>
            <div className="briefing-label">
              <div className="aria-dot" />
              <span className="briefing-title">Today's briefing</span>
            </div>
            <span className="briefing-toggle">{briefingOpen ? '↑ close' : '↓ read'}</span>
          </div>
          <div className={`briefing-body${briefingOpen ? ' open' : ''}`}>
            <div className="briefing-text">{BRIEFING}</div>
          </div>
        </div>

      </div>
    </>
  );
}
