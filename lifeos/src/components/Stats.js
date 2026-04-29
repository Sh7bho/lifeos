import React, { useState, useEffect } from 'react';
import { getRecentLogs, getStreaks, HABITS } from '../lib/supabase';
import './Stats.css';

function HeatmapCell({ date, logs }) {
  const count = logs.filter(l => l.date === date).length;
  const intensity = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count >= 3 ? 3 : 0;
  return <div className={`hm-cell hm-intensity-${intensity}`} title={`${date}: ${count} habits`} />;
}

function WeekRow({ habit, logs, dates }) {
  return (
    <div className="week-row">
      <span className="week-habit-icon">{habit.icon}</span>
      <div className="week-dots">
        {dates.map(d => {
          const done = logs.some(l => l.habit_id === habit.id && l.date === d);
          return (
            <div key={d} className={`week-dot ${done ? 'week-dot--done' : ''}`} style={{ '--accent': habit.color }} />
          );
        })}
      </div>
    </div>
  );
}

export default function Stats() {
  const [logs, setLogs] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getRecentLogs(30), getStreaks()])
      .then(([l, s]) => { setLogs(l); setStreaks(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Last 30 days array
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  // Last 7 days
  const last7 = last30.slice(-7);
  const dayLabels = ['M','T','W','T','F','S','S'];
  const last7Labels = last7.map(d => {
    const day = new Date(d + 'T00:00:00').getDay();
    return ['S','M','T','W','T','F','S'][day];
  });

  // Per-habit stats
  const habitStats = HABITS.map(h => {
    const habitLogs = logs.filter(l => l.habit_id === h.id);
    const count30 = habitLogs.length;
    const count7 = habitLogs.filter(l => last7.includes(l.date)).length;
    const pct = Math.round((count30 / 30) * 100);
    return { ...h, count30, count7, pct, streak: streaks[h.id] || 0 };
  });

  const totalToday = logs.filter(l => l.date === new Date().toISOString().split('T')[0]).length;
  const bestStreak = Math.max(...Object.values(streaks));

  if (loading) return (
    <div className="page stats-loading"><div className="spinner" /></div>
  );

  return (
    <div className="page">
      <div className="page-header animate-fadeup">
        <div className="page-title">STATS</div>
        <div className="page-subtitle">Your 30-day performance</div>
      </div>

      {/* Top numbers */}
      <div className="stat-row animate-fadeup-1">
        <div className="stat-box">
          <div className="stat-num" style={{ color: 'var(--accent-orange)' }}>{totalToday}</div>
          <div className="stat-lbl">TODAY</div>
        </div>
        <div className="stat-box">
          <div className="stat-num" style={{ color: 'var(--accent-cyan)' }}>{logs.length}</div>
          <div className="stat-lbl">30D LOGS</div>
        </div>
        <div className="stat-box">
          <div className="stat-num" style={{ color: 'var(--accent-gold)' }}>{bestStreak}</div>
          <div className="stat-lbl">BEST STREAK</div>
        </div>
      </div>

      {/* 7-day heatmap per habit */}
      <div className="card animate-fadeup-2">
        <div className="card-label">THIS WEEK</div>
        <div className="week-labels">
          {last7Labels.map((l, i) => (
            <span key={i} className="week-label">{l}</span>
          ))}
        </div>
        {HABITS.map(h => (
          <WeekRow key={h.id} habit={h} logs={logs} dates={last7} />
        ))}
      </div>

      {/* Per-habit breakdown */}
      <div className="card animate-fadeup-3">
        <div className="card-label">HABIT BREAKDOWN — 30 DAYS</div>
        {habitStats.map(h => (
          <div key={h.id} className="habit-stat-row">
            <span className="habit-stat-icon">{h.icon}</span>
            <div className="habit-stat-info">
              <div className="habit-stat-top">
                <span className="habit-stat-name">{h.label}</span>
                <span className="habit-stat-pct" style={{ color: h.color }}>{h.pct}%</span>
              </div>
              <div className="habit-stat-bar-bg">
                <div
                  className="habit-stat-bar-fill"
                  style={{ width: `${h.pct}%`, background: h.color }}
                />
              </div>
              <div className="habit-stat-meta">
                <span>{h.count30} days logged</span>
                <span>{h.streak}d streak</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 30-day activity heatmap */}
      <div className="card animate-fadeup-4">
        <div className="card-label">30-DAY ACTIVITY</div>
        <div className="heatmap-grid">
          {last30.map(d => (
            <HeatmapCell key={d} date={d} logs={logs} />
          ))}
        </div>
        <div className="hm-legend">
          <span className="hm-legend-lbl">LESS</span>
          {[0,1,2,3].map(i => (
            <div key={i} className={`hm-cell hm-intensity-${i}`} />
          ))}
          <span className="hm-legend-lbl">MORE</span>
        </div>
      </div>
    </div>
  );
}
