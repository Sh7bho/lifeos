import React, { useState, useEffect } from 'react';
import { logHabit, getTodayLogs, HABITS } from '../lib/supabase';
import './HabitLog.css';

export default function HabitLog({ onDone }) {
  const [todayLogs, setTodayLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [duration, setDuration] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    getTodayLogs().then(setTodayLogs).catch(console.error);
  }, []);

  async function handleLog() {
    if (!selected) return;
    setSaving(true);
    try {
      await logHabit({
        habit_id: selected,
        duration_min: duration ? parseInt(duration) : null,
        note: note.trim(),
      });
      setSaved(selected);
      setTodayLogs(prev => {
        const filtered = prev.filter(l => l.habit_id !== selected);
        return [...filtered, { habit_id: selected, duration_min: duration || null, note }];
      });
      setTimeout(() => {
        setSelected(null);
        setDuration('');
        setNote('');
        setSaved(null);
      }, 900);
    } catch (err) {
      alert('Error saving. Check your connection.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header animate-fadeup">
        <div className="page-title">LOG IT</div>
        <div className="page-subtitle">What did you crush today?</div>
      </div>

      <div className="habit-grid animate-fadeup-1">
        {HABITS.map(h => {
          const isLogged = todayLogs.some(l => l.habit_id === h.id);
          const isSelected = selected === h.id;
          const isSaved = saved === h.id;
          return (
            <button
              key={h.id}
              className={`habit-tile ${isSelected ? 'habit-tile--selected' : ''} ${isLogged ? 'habit-tile--logged' : ''} ${isSaved ? 'habit-tile--saved' : ''}`}
              style={{ '--accent': h.color }}
              onClick={() => setSelected(isSelected ? null : h.id)}
            >
              <span className="habit-tile-icon">{isSaved ? '✓' : h.icon}</span>
              <span className="habit-tile-label">{h.label}</span>
              {isLogged && !isSelected && <span className="habit-tile-badge">DONE</span>}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="log-form card animate-fadeup">
          {(() => {
            const h = HABITS.find(x => x.id === selected);
            return (
              <>
                <div className="log-form-title" style={{ color: h.color }}>
                  {h.icon} {h.label}
                </div>
                <div className="log-field">
                  <label className="log-label">DURATION (min)</label>
                  <input
                    type="number"
                    className="log-input"
                    placeholder="e.g. 45"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
                <div className="log-field">
                  <label className="log-label">NOTE (optional)</label>
                  <input
                    type="text"
                    className="log-input"
                    placeholder="e.g. hit PR on bench press"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-primary log-save-btn"
                  onClick={handleLog}
                  disabled={saving}
                  style={{ background: h.color, color: '#000' }}
                >
                  {saving ? <span className="spinner" /> : `LOCK IT IN →`}
                </button>
              </>
            );
          })()}
        </div>
      )}

      <button className="btn btn-ghost done-btn animate-fadeup-4" onClick={onDone}>
        ← BACK TO HQ
      </button>
    </div>
  );
}
