import React, { useState, useEffect, useRef } from 'react';
import BackHeader from './BackHeader';
import { supabase } from '../lib/supabase';

// ── Supabase helpers ─────────────────────────────────────────────────────────

export async function logFocusSession({ duration_min, label }) {
  const { error } = await supabase
    .from('focus_sessions')
    .insert({
      duration_min,
      label,
      date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    });
  if (error) throw error;
}

export async function getTodayFocusSessions() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('date', today)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getWeekFocusMinutes() {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration_min, date')
    .gte('date', since.toISOString().split('T')[0]);
  if (error) throw error;
  return (data || []).reduce((a, b) => a + (b.duration_min || 0), 0);
}

// ── Constants ────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Deep Work', minutes: 90, color: '#C8A95A' },
  { label: 'Focus', minutes: 45, color: '#5B8DEF' },
  { label: 'Pomodoro', minutes: 25, color: '#EF8C5B' },
  { label: 'Quick', minutes: 15, color: '#5BEF8C' },
];

const BREAK = 5;

function fmt(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function FocusTimer({ onNavigate }) {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [phase, setPhase] = useState('idle'); // idle | focus | break | done
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[0].minutes * 60);
  const [sessions, setSessions] = useState([]);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [sessionLabel, setSessionLabel] = useState('');
  const [completedSessions, setCompletedSessions] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    async function load() {
      const [s, w] = await Promise.all([
        getTodayFocusSessions(),
        getWeekFocusMinutes(),
      ]);
      setSessions(s);
      setWeekMinutes(w);
    }
    load();
  }, []);

  useEffect(() => {
    if (phase === 'focus' || phase === 'break') {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            handleTimerEnd();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [phase]);

  async function handleTimerEnd() {
    if (phase === 'focus') {
      const mins = preset.minutes;
      try {
        await logFocusSession({ duration_min: mins, label: sessionLabel || preset.label });
        setSessions(prev => [{
          duration_min: mins,
          label: sessionLabel || preset.label,
          created_at: new Date().toISOString(),
        }, ...prev]);
        setWeekMinutes(w => w + mins);
        setCompletedSessions(c => c + 1);
      } catch (e) { console.error(e); }
      setPhase('break');
      setSecondsLeft(BREAK * 60);
    } else if (phase === 'break') {
      setPhase('done');
    }
  }

  function start() {
    setPhase('focus');
    setSecondsLeft(preset.minutes * 60);
    startTimeRef.current = Date.now();
  }

  function pause() {
    clearInterval(intervalRef.current);
    setPhase('idle');
  }

  function reset() {
    clearInterval(intervalRef.current);
    setPhase('idle');
    setSecondsLeft(preset.minutes * 60);
  }

  function selectPreset(p) {
    if (phase !== 'idle' && phase !== 'done') return;
    setPreset(p);
    setSecondsLeft(p.minutes * 60);
    setPhase('idle');
  }

  const totalSeconds = phase === 'break' ? BREAK * 60 : preset.minutes * 60;
  const progress = 1 - secondsLeft / totalSeconds;
  const radius = 110;
  const circ = 2 * Math.PI * radius;
  const offset = circ - progress * circ;
  const todayMinutes = sessions.reduce((a, b) => a + (b.duration_min || 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Mono:wght@300;400&family=Syne:wght@600;700;800&display=swap');

        .ft-wrap {
          min-height: 100vh;
          background: #0c0c0c;
          color: #e8e3da;
          font-family: 'Syne', sans-serif;
          display: grid;
          grid-template-columns: 1fr 320px;
        }

        /* LEFT — timer */
        .ft-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 52px 48px;
          border-right: 1px solid #141414;
          min-height: 100vh;
          animation: fadeUp 0.4s 0.05s both;
        }

        /* PRESETS */
        .ft-presets {
          display: flex;
          gap: 8px;
          margin-bottom: 56px;
        }

        .ft-preset {
          padding: 8px 18px;
          border-radius: 20px;
          border: 1px solid #1a1a1a;
          background: #0f0f0f;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          color: #333;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
        }

        .ft-preset:hover { border-color: #2a2a2a; color: #555; }
        .ft-preset.active { color: var(--pc); border-color: var(--pc); background: transparent; }

        /* RING */
        .ft-ring-wrap {
          position: relative;
          margin-bottom: 48px;
        }

        .ft-ring-svg { transform: rotate(-90deg); display: block; }
        .ft-ring-track { fill: none; stroke: #141414; stroke-width: 4; }
        .ft-ring-fill {
          fill: none;
          stroke-width: 4;
          stroke-linecap: round;
          transition: stroke-dashoffset 1s linear, stroke 0.4s;
        }

        .ft-ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .ft-time {
          font-family: 'DM Mono', monospace;
          font-size: 52px;
          font-weight: 400;
          color: #e8e3da;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .ft-phase-lbl {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #333;
        }

        .ft-phase-lbl.focus { color: var(--pc, #C8A95A); }
        .ft-phase-lbl.break { color: #5BEF8C; }

        /* LABEL INPUT */
        .ft-label-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid #1a1a1a;
          outline: none;
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 300;
          color: #555;
          text-align: center;
          width: 280px;
          padding: 8px 0;
          margin-bottom: 40px;
          transition: border-color 0.2s, color 0.2s;
          caret-color: #C8A95A;
        }

        .ft-label-input::placeholder { color: #222; }
        .ft-label-input:focus { border-color: #2a2a2a; color: #888; }

        /* CONTROLS */
        .ft-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .ft-btn-main {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          transition: all 0.2s;
          background: var(--pc, #C8A95A);
          color: #0c0c0c;
        }

        .ft-btn-main:hover { transform: scale(1.05); opacity: 0.9; }
        .ft-btn-main:active { transform: scale(0.97); }

        .ft-btn-secondary {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid #1e1e1e;
          background: #0f0f0f;
          color: #333;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.2s;
        }

        .ft-btn-secondary:hover { border-color: #2a2a2a; color: #555; }

        /* DONE state */
        .ft-done {
          text-align: center;
          animation: fadeUp 0.4s both;
        }

        .ft-done-emoji { font-size: 48px; margin-bottom: 16px; }

        .ft-done-title {
          font-size: 28px;
          font-weight: 700;
          color: #e8e3da;
          margin-bottom: 8px;
        }

        .ft-done-sub {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 300;
          color: #444;
          margin-bottom: 32px;
        }

        .ft-another {
          padding: 12px 28px;
          background: #C8A95A;
          color: #0c0c0c;
          border: none;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .ft-another:hover { opacity: 0.88; }

        /* RIGHT — sessions */
        .ft-sidebar {
          padding: 52px 32px 60px;
          animation: fadeUp 0.4s 0.15s both;
        }

        .ft-sidebar-title {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.25em;
          color: #222;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        /* STATS */
        .ft-stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 32px;
        }

        .ft-stat {
          background: #0f0f0f;
          border: 1px solid #161616;
          border-radius: 12px;
          padding: 16px;
        }

        .ft-stat-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 500;
          color: #e8e3da;
          line-height: 1;
          margin-bottom: 4px;
        }

        .ft-stat-val span { font-size: 13px; color: #2a2a2a; font-weight: 300; }

        .ft-stat-lbl {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.15em;
          color: #222;
          text-transform: uppercase;
        }

        /* SESSION LIST */
        .ft-session-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ft-session {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 10px;
          transition: background 0.15s;
        }

        .ft-session:hover { background: #0f0f0f; }

        .ft-session-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #C8A95A;
          flex-shrink: 0;
        }

        .ft-session-info { flex: 1; }

        .ft-session-label {
          font-size: 13px;
          font-weight: 600;
          color: #555;
          letter-spacing: -0.01em;
        }

        .ft-session-time {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: #222;
          margin-top: 2px;
          letter-spacing: 0.08em;
        }

        .ft-session-dur {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #333;
        }

        .ft-empty {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 300;
          color: #1e1e1e;
          font-style: italic;
          padding: 24px 0;
          text-align: center;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <BackHeader title="Focus" onBack={() => onNavigate('dashboard')} accent="#5BEF8C" />

      <div className="ft-wrap">

        {/* ── LEFT ── */}
        <div className="ft-main">

          {phase !== 'done' ? (
            <>
              {/* PRESETS */}
              <div className="ft-presets">
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    className={`ft-preset${preset.label === p.label ? ' active' : ''}`}
                    style={{ '--pc': p.color }}
                    onClick={() => selectPreset(p)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* RING */}
              <div className="ft-ring-wrap">
                <svg width="280" height="280" viewBox="0 0 280 280" className="ft-ring-svg">
                  <circle className="ft-ring-track" cx="140" cy="140" r={radius} />
                  <circle
                    className="ft-ring-fill"
                    cx="140" cy="140" r={radius}
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    stroke={phase === 'break' ? '#5BEF8C' : preset.color}
                  />
                </svg>
                <div className="ft-ring-center">
                  <div className="ft-time">{fmt(secondsLeft)}</div>
                  <div className={`ft-phase-lbl ${phase}`}>
                    {phase === 'idle' ? preset.label
                      : phase === 'focus' ? 'Focus'
                      : phase === 'break' ? 'Break'
                      : ''}
                  </div>
                </div>
              </div>

              {/* LABEL */}
              {phase === 'idle' && (
                <input
                  className="ft-label-input"
                  placeholder="What are you working on?"
                  value={sessionLabel}
                  onChange={e => setSessionLabel(e.target.value)}
                />
              )}

              {/* CONTROLS */}
              <div className="ft-controls">
                {phase !== 'idle' && (
                  <button className="ft-btn-secondary" onClick={reset} title="Reset">↺</button>
                )}
                <button
                  className="ft-btn-main"
                  style={{ '--pc': phase === 'break' ? '#5BEF8C' : preset.color }}
                  onClick={phase === 'idle' ? start : pause}
                >
                  {phase === 'idle' ? '▶' : phase === 'focus' || phase === 'break' ? '⏸' : '▶'}
                </button>
                {phase !== 'idle' && (
                  <button className="ft-btn-secondary" onClick={handleTimerEnd} title="Skip">⏭</button>
                )}
              </div>
            </>
          ) : (
            <div className="ft-done">
              <div className="ft-done-emoji">🔥</div>
              <div className="ft-done-title">Session complete.</div>
              <div className="ft-done-sub">
                {completedSessions} session{completedSessions !== 1 ? 's' : ''} today · {todayMinutes} min
              </div>
              <button className="ft-another" onClick={reset}>Another round →</button>
            </div>
          )}

        </div>

        {/* ── RIGHT ── */}
        <div className="ft-sidebar">
          <div className="ft-sidebar-title">Today's focus</div>

          <div className="ft-stats-row">
            <div className="ft-stat">
              <div className="ft-stat-val">{todayMinutes}<span>m</span></div>
              <div className="ft-stat-lbl">Today</div>
            </div>
            <div className="ft-stat">
              <div className="ft-stat-val">{weekMinutes}<span>m</span></div>
              <div className="ft-stat-lbl">This week</div>
            </div>
          </div>

          <div className="ft-sidebar-title">Sessions</div>

          {sessions.length === 0 ? (
            <div className="ft-empty">No sessions yet today.</div>
          ) : (
            <div className="ft-session-list">
              {sessions.map((s, i) => (
                <div key={i} className="ft-session">
                  <div className="ft-session-dot" />
                  <div className="ft-session-info">
                    <div className="ft-session-label">{s.label || 'Focus session'}</div>
                    <div className="ft-session-time">
                      {new Date(s.created_at).toLocaleTimeString('en-GB', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="ft-session-dur">{s.duration_min}m</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
