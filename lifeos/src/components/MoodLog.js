import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import BackHeader from './BackHeader';

// ── Supabase helpers ─────────────────────────────────────────────────────────

export async function logMood({ mood, energy, note = '' }) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('mood_logs')
    .upsert(
      { date: today, mood, energy, note, created_at: new Date().toISOString() },
      { onConflict: 'date' }
    )
    .select();
  if (error) throw error;
  return data;
}

export async function getTodayMood() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('date', today)
    .single();
  return data;
}

export async function getRecentMoods(days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from('mood_logs')
    .select('*')
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── Constants ────────────────────────────────────────────────────────────────

const MOODS = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'Locked in' },
];

const ENERGY = [
  { value: 1, label: 'Drained' },
  { value: 2, label: 'Tired' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Energised' },
  { value: 5, label: 'Peaked' },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function MoodLog({ onDone, onNavigate }) {
  const [mood, setMood] = useState(null);
  const [energy, setEnergy] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentMoods, setRecentMoods] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [todayData, recent] = await Promise.all([
          getTodayMood(),
          getRecentMoods(14),
        ]);
        if (todayData) {
          setExisting(todayData);
          setMood(todayData.mood);
          setEnergy(todayData.energy);
          setNote(todayData.note || '');
        }
        setRecentMoods(recent);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    if (!mood || !energy) return;
    setSaving(true);
    try {
      await logMood({ mood, energy, note });
      setSaved(true);
      setTimeout(() => onDone?.(), 1200);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const avgMood = recentMoods.length
    ? (recentMoods.reduce((a, b) => a + b.mood, 0) / recentMoods.length).toFixed(1)
    : null;

  const avgEnergy = recentMoods.length
    ? (recentMoods.reduce((a, b) => a + b.energy, 0) / recentMoods.length).toFixed(1)
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Mono:wght@300;400&family=Syne:wght@600;700;800&display=swap');

        .ml-wrap {
          min-height: 100vh;
          background: #0c0c0c;
          color: #e8e3da;
          font-family: 'Syne', sans-serif;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: start;
        }

        /* LEFT — form */
        .ml-left {
          padding: 52px 48px 60px;
          border-right: 1px solid #141414;
          min-height: 100vh;
        }

        /* RIGHT — history */
        .ml-right {
          padding: 52px 48px 60px;
        }

        /* HEADER */
        .ml-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          color: #333;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .ml-title {
          font-size: 40px;
          font-weight: 800;
          color: #e8e3da;
          line-height: 1;
          letter-spacing: -0.03em;
          margin-bottom: 4px;
        }

        .ml-title span { color: #C8A95A; }

        .ml-sub {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 300;
          color: #333;
          margin-bottom: 44px;
        }

        /* SECTION */
        .ml-section {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.25em;
          color: #2e2e2e;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        /* MOOD PICKER */
        .ml-mood-grid {
          display: flex;
          gap: 8px;
          margin-bottom: 36px;
        }

        .ml-mood-btn {
          flex: 1;
          background: #0f0f0f;
          border: 1px solid #1a1a1a;
          border-radius: 14px;
          padding: 16px 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .ml-mood-btn:hover {
          border-color: #2a2a2a;
          background: #111;
        }

        .ml-mood-btn.selected {
          border-color: #C8A95A;
          background: rgba(200,169,90,0.06);
        }

        .ml-mood-emoji {
          font-size: 26px;
          line-height: 1;
          transition: transform 0.2s;
        }

        .ml-mood-btn:hover .ml-mood-emoji,
        .ml-mood-btn.selected .ml-mood-emoji {
          transform: scale(1.15);
        }

        .ml-mood-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          color: #333;
          text-transform: uppercase;
          transition: color 0.2s;
        }

        .ml-mood-btn.selected .ml-mood-label { color: #C8A95A; }

        /* ENERGY SLIDER */
        .ml-energy-track {
          display: flex;
          gap: 6px;
          margin-bottom: 36px;
        }

        .ml-energy-seg {
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: #1a1a1a;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .ml-energy-seg.filled { background: #C8A95A; }
        .ml-energy-seg:hover { transform: scaleY(1.5); }

        .ml-energy-labels {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          margin-bottom: 36px;
        }

        .ml-energy-lbl {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: #2a2a2a;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: color 0.2s;
        }

        .ml-energy-lbl.active { color: #C8A95A; }

        /* NOTE */
        .ml-note {
          width: 100%;
          background: #0f0f0f;
          border: 1px solid #1a1a1a;
          border-radius: 14px;
          padding: 16px 18px;
          color: #d8d3ca;
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 300;
          line-height: 1.6;
          resize: none;
          outline: none;
          transition: border-color 0.2s;
          margin-bottom: 28px;
          box-sizing: border-box;
        }

        .ml-note::placeholder { color: #252525; }
        .ml-note:focus { border-color: #252525; }

        /* SAVE BTN */
        .ml-save {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ml-save:not(:disabled) {
          background: #C8A95A;
          color: #0c0c0c;
        }

        .ml-save:disabled {
          background: #141414;
          color: #2a2a2a;
          cursor: not-allowed;
        }

        .ml-save.done {
          background: #5BEF8C;
          color: #0c0c0c;
        }

        .ml-save:not(:disabled):hover { opacity: 0.88; }
        .ml-save:not(:disabled):active { transform: scale(0.98); }

        /* RIGHT SIDE — stats + history */
        .ml-avg-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 40px;
        }

        .ml-avg-card {
          background: #0f0f0f;
          border: 1px solid #161616;
          border-radius: 14px;
          padding: 20px;
        }

        .ml-avg-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 42px;
          font-weight: 500;
          color: #e8e3da;
          line-height: 1;
          margin-bottom: 4px;
        }

        .ml-avg-val span {
          font-size: 16px;
          color: #C8A95A;
        }

        .ml-avg-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.2em;
          color: #2a2a2a;
          text-transform: uppercase;
        }

        /* HISTORY */
        .ml-history {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ml-hist-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 14px;
          border-radius: 12px;
          transition: background 0.15s;
        }

        .ml-hist-row:hover { background: #0f0f0f; }

        .ml-hist-date {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #333;
          width: 56px;
          flex-shrink: 0;
          letter-spacing: 0.05em;
        }

        .ml-hist-emoji {
          font-size: 18px;
          width: 28px;
          text-align: center;
          flex-shrink: 0;
        }

        .ml-hist-bars {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ml-hist-bar-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ml-hist-bar-bg {
          flex: 1;
          height: 3px;
          background: #141414;
          border-radius: 2px;
          overflow: hidden;
        }

        .ml-hist-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
        }

        .ml-hist-bar-lbl {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          color: #2a2a2a;
          letter-spacing: 0.1em;
          width: 36px;
          text-align: right;
          flex-shrink: 0;
        }

        .ml-hist-note {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          color: #2a2a2a;
          font-style: italic;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
          flex-shrink: 0;
        }

        /* EMPTY */
        .ml-empty {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 300;
          color: #222;
          text-align: center;
          padding: 48px 0;
          letter-spacing: 0.02em;
        }

        /* EXISTING BADGE */
        .ml-existing {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(200,169,90,0.08);
          border: 1px solid rgba(200,169,90,0.2);
          border-radius: 8px;
          padding: 8px 14px;
          margin-bottom: 28px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #C8A95A;
          letter-spacing: 0.1em;
        }

        .ml-existing-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #C8A95A;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ml-left { animation: fadeUp 0.4s 0.05s both; }
        .ml-right { animation: fadeUp 0.4s 0.15s both; }
      `}</style>

      <BackHeader title="Mood" onBack={() => onNavigate ? onNavigate('dashboard') : onDone?.()} accent="#5B8DEF" />

      <div className="ml-wrap">

        {/* ── LEFT — form ── */}
        <div className="ml-left">
          <div className="ml-eyebrow">Daily check-in</div>
          <div className="ml-title">How are<br/>you<span>?</span></div>
          <div className="ml-sub">Honest. Takes 10 seconds.</div>

          {existing && (
            <div className="ml-existing">
              <div className="ml-existing-dot" />
              Already logged today — updating
            </div>
          )}

          {/* MOOD */}
          <div className="ml-section">Mood</div>
          <div className="ml-mood-grid">
            {MOODS.map(m => (
              <button
                key={m.value}
                className={`ml-mood-btn${mood === m.value ? ' selected' : ''}`}
                onClick={() => setMood(m.value)}
              >
                <span className="ml-mood-emoji">{m.emoji}</span>
                <span className="ml-mood-label">{m.label}</span>
              </button>
            ))}
          </div>

          {/* ENERGY */}
          <div className="ml-section">Energy level</div>
          <div className="ml-energy-track">
            {ENERGY.map(e => (
              <div
                key={e.value}
                className={`ml-energy-seg${energy >= e.value ? ' filled' : ''}`}
                onClick={() => setEnergy(e.value)}
              />
            ))}
          </div>
          <div className="ml-energy-labels">
            {ENERGY.map(e => (
              <span
                key={e.value}
                className={`ml-energy-lbl${energy === e.value ? ' active' : ''}`}
                onClick={() => setEnergy(e.value)}
              >
                {e.label}
              </span>
            ))}
          </div>

          {/* NOTE */}
          <div className="ml-section">One thought (optional)</div>
          <textarea
            className="ml-note"
            rows={3}
            placeholder="What's on your mind today..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />

          <button
            className={`ml-save${saved ? ' done' : ''}`}
            disabled={!mood || !energy || saving}
            onClick={handleSave}
          >
            {saved ? '✓ Logged' : saving ? 'Saving...' : 'Lock it in →'}
          </button>
        </div>

        {/* ── RIGHT — history ── */}
        <div className="ml-right">
          <div className="ml-eyebrow">Last 14 days</div>
          <div className="ml-title" style={{ fontSize: 32, marginBottom: 28 }}>
            Your<span style={{ color: '#C8A95A' }}> pattern</span>
          </div>

          {/* AVERAGES */}
          {recentMoods.length > 0 && (
            <div className="ml-avg-row">
              <div className="ml-avg-card">
                <div className="ml-avg-val">
                  {avgMood}
                  <span>/5</span>
                </div>
                <div className="ml-avg-label">Avg mood</div>
              </div>
              <div className="ml-avg-card">
                <div className="ml-avg-val">
                  {avgEnergy}
                  <span>/5</span>
                </div>
                <div className="ml-avg-label">Avg energy</div>
              </div>
            </div>
          )}

          <div className="ml-section">History</div>

          {loading ? (
            <div className="ml-empty">Loading...</div>
          ) : recentMoods.length === 0 ? (
            <div className="ml-empty">No entries yet.<br/>Start today.</div>
          ) : (
            <div className="ml-history">
              {[...recentMoods].reverse().map(entry => {
                const moodObj = MOODS.find(m => m.value === entry.mood);
                const dateLabel = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-GB', {
                  weekday: 'short', day: 'numeric', month: 'short'
                });
                return (
                  <div key={entry.date} className="ml-hist-row">
                    <span className="ml-hist-date">{dateLabel}</span>
                    <span className="ml-hist-emoji">{moodObj?.emoji}</span>
                    <div className="ml-hist-bars">
                      <div className="ml-hist-bar-wrap">
                        <div className="ml-hist-bar-bg">
                          <div
                            className="ml-hist-bar-fill"
                            style={{
                              width: `${(entry.mood / 5) * 100}%`,
                              background: '#C8A95A',
                            }}
                          />
                        </div>
                        <span className="ml-hist-bar-lbl">mood</span>
                      </div>
                      <div className="ml-hist-bar-wrap">
                        <div className="ml-hist-bar-bg">
                          <div
                            className="ml-hist-bar-fill"
                            style={{
                              width: `${(entry.energy / 5) * 100}%`,
                              background: '#5B8DEF',
                            }}
                          />
                        </div>
                        <span className="ml-hist-bar-lbl">energy</span>
                      </div>
                    </div>
                    {entry.note ? (
                      <span className="ml-hist-note">"{entry.note}"</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
