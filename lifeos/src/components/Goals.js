import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ── Supabase helpers ─────────────────────────────────────────────────────────

export async function getGoals() {
  const { data, error } = await supabase
    .from('goals')
    .select('*, milestones(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createGoal({ title, description, deadline, category }) {
  const { data, error } = await supabase
    .from('goals')
    .insert({ title, description, deadline, category, created_at: new Date().toISOString() })
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateGoal(id, updates) {
  const { error } = await supabase.from('goals').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteGoal(id) {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

export async function createMilestone({ goal_id, title }) {
  const { data, error } = await supabase
    .from('milestones')
    .insert({ goal_id, title, done: false, created_at: new Date().toISOString() })
    .select();
  if (error) throw error;
  return data[0];
}

export async function toggleMilestone(id, done) {
  const { error } = await supabase.from('milestones').update({ done }).eq('id', id);
  if (error) throw error;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'build', label: 'Build', color: '#C8A95A' },
  { id: 'learn', label: 'Learn', color: '#5B8DEF' },
  { id: 'health', label: 'Health', color: '#5BEF8C' },
  { id: 'money', label: 'Money', color: '#EF8C5B' },
  { id: 'life', label: 'Life', color: '#C45BEF' },
];

function daysLeft(deadline) {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  return diff;
}

function progressPct(milestones = []) {
  if (!milestones.length) return 0;
  return Math.round((milestones.filter(m => m.done).length / milestones.length) * 100);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState(null);
  const [newMilestone, setNewMilestone] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', deadline: '', category: 'build'
  });

  useEffect(() => { loadGoals(); }, []);

  async function loadGoals() {
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleCreateGoal() {
    if (!form.title.trim()) return;
    try {
      const goal = await createGoal(form);
      setGoals(prev => [{ ...goal, milestones: [] }, ...prev]);
      setForm({ title: '', description: '', deadline: '', category: 'build' });
      setShowForm(false);
    } catch (e) { console.error(e); }
  }

  async function handleAddMilestone(goalId) {
    if (!newMilestone.trim()) return;
    try {
      const ms = await createMilestone({ goal_id: goalId, title: newMilestone });
      setGoals(prev => prev.map(g =>
        g.id === goalId ? { ...g, milestones: [...(g.milestones || []), ms] } : g
      ));
      setNewMilestone('');
    } catch (e) { console.error(e); }
  }

  async function handleToggleMilestone(goalId, msId, done) {
    try {
      await toggleMilestone(msId, done);
      setGoals(prev => prev.map(g =>
        g.id === goalId
          ? { ...g, milestones: g.milestones.map(m => m.id === msId ? { ...m, done } : m) }
          : g
      ));
    } catch (e) { console.error(e); }
  }

  async function handleDeleteGoal(id) {
    try {
      await deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      if (expandedGoal === id) setExpandedGoal(null);
    } catch (e) { console.error(e); }
  }

  const cat = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Mono:wght@300;400&family=Syne:wght@600;700;800&display=swap');

        .g-wrap {
          min-height: 100vh;
          background: #0c0c0c;
          color: #e8e3da;
          font-family: 'Syne', sans-serif;
          display: grid;
          grid-template-columns: 300px 1fr;
        }

        /* LEFT — header + form */
        .g-left {
          padding: 52px 32px 60px;
          border-right: 1px solid #141414;
          min-height: 100vh;
          animation: fadeUp 0.4s 0.05s both;
        }

        .g-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          color: #333;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .g-title {
          font-size: 38px;
          font-weight: 800;
          color: #e8e3da;
          line-height: 1;
          letter-spacing: -0.03em;
          margin-bottom: 32px;
        }

        .g-title span { color: #C8A95A; }

        /* SUMMARY */
        .g-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 32px;
        }

        .g-sum-card {
          background: #0f0f0f;
          border: 1px solid #161616;
          border-radius: 12px;
          padding: 14px;
        }

        .g-sum-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          font-weight: 500;
          color: #e8e3da;
          line-height: 1;
          margin-bottom: 3px;
        }

        .g-sum-lbl {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.15em;
          color: #222;
          text-transform: uppercase;
        }

        /* ADD BUTTON */
        .g-add-btn {
          width: 100%;
          padding: 13px;
          background: #C8A95A;
          color: #0c0c0c;
          border: none;
          border-radius: 11px;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s;
          margin-bottom: 20px;
        }

        .g-add-btn:hover { opacity: 0.88; }

        /* FORM */
        .g-form {
          background: #0f0f0f;
          border: 1px solid #1a1a1a;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: fadeUp 0.3s both;
        }

        .g-input, .g-textarea, .g-select {
          width: 100%;
          background: #141414;
          border: 1px solid #1e1e1e;
          border-radius: 8px;
          padding: 10px 14px;
          color: #d8d3ca;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .g-textarea {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 300;
          resize: none;
        }

        .g-input::placeholder, .g-textarea::placeholder { color: #222; }
        .g-input:focus, .g-textarea:focus, .g-select:focus { border-color: #2a2a2a; }
        .g-select option { background: #141414; }

        /* CATEGORY PILLS */
        .g-cats {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .g-cat-pill {
          padding: 5px 12px;
          border-radius: 20px;
          border: 1px solid #1a1a1a;
          background: transparent;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s;
          color: #333;
        }

        .g-cat-pill.active { color: var(--cc); border-color: var(--cc); }

        .g-form-btns {
          display: flex;
          gap: 8px;
        }

        .g-form-save {
          flex: 1;
          padding: 10px;
          background: #C8A95A;
          color: #0c0c0c;
          border: none;
          border-radius: 8px;
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .g-form-save:hover { opacity: 0.88; }

        .g-form-cancel {
          padding: 10px 16px;
          background: transparent;
          color: #333;
          border: 1px solid #1a1a1a;
          border-radius: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .g-form-cancel:hover { color: #555; border-color: #2a2a2a; }

        /* RIGHT — goals list */
        .g-right {
          padding: 52px 48px 60px;
          animation: fadeUp 0.4s 0.12s both;
        }

        .g-section {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.25em;
          color: #222;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        /* GOAL CARD */
        .g-card {
          background: #0f0f0f;
          border: 1px solid #161616;
          border-radius: 16px;
          margin-bottom: 10px;
          overflow: hidden;
          transition: border-color 0.2s;
        }

        .g-card:hover { border-color: #1e1e1e; }

        .g-card-head {
          padding: 20px 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .g-card-color {
          width: 3px;
          height: 36px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .g-card-info { flex: 1; }

        .g-card-cat {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .g-card-title {
          font-size: 17px;
          font-weight: 700;
          color: #d8d3ca;
          letter-spacing: -0.01em;
          margin-bottom: 10px;
        }

        .g-progress-bar-bg {
          height: 3px;
          background: #141414;
          border-radius: 2px;
          overflow: hidden;
          width: 100%;
        }

        .g-progress-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
        }

        .g-card-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          flex-shrink: 0;
        }

        .g-pct {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          color: #444;
        }

        .g-deadline {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          color: #222;
        }

        .g-deadline.urgent { color: #EF8C5B; }
        .g-deadline.done-dl { color: #5BEF8C; }

        /* EXPANDED */
        .g-card-body {
          padding: 0 24px;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1), padding 0.3s;
        }

        .g-card-body.open {
          max-height: 500px;
          padding-bottom: 20px;
        }

        .g-card-desc {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 300;
          color: #333;
          line-height: 1.6;
          margin-bottom: 16px;
          border-top: 1px solid #141414;
          padding-top: 16px;
        }

        /* MILESTONES */
        .g-milestones {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 14px;
        }

        .g-ms {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          transition: background 0.15s;
          cursor: pointer;
        }

        .g-ms:hover { background: #141414; }

        .g-ms-check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid #2a2a2a;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .g-ms-check.done {
          background: rgba(91,239,140,0.15);
          border-color: rgba(91,239,140,0.5);
        }

        .g-ms-check svg { opacity: 0; transition: opacity 0.2s; }
        .g-ms-check.done svg { opacity: 1; }

        .g-ms-label {
          font-size: 13px;
          font-weight: 600;
          color: #555;
          transition: color 0.2s;
        }

        .g-ms.checked .g-ms-label { color: #2a2a2a; text-decoration: line-through; }

        /* ADD MILESTONE */
        .g-ms-add {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }

        .g-ms-input {
          flex: 1;
          background: #141414;
          border: 1px solid #1e1e1e;
          border-radius: 8px;
          padding: 8px 12px;
          color: #d8d3ca;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          outline: none;
        }

        .g-ms-input::placeholder { color: #222; }

        .g-ms-add-btn {
          padding: 8px 14px;
          background: transparent;
          border: 1px solid #1e1e1e;
          border-radius: 8px;
          color: #333;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .g-ms-add-btn:hover { border-color: #C8A95A; color: #C8A95A; }

        .g-delete-btn {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          color: #222;
          background: none;
          border: none;
          cursor: pointer;
          text-transform: uppercase;
          padding: 0;
          transition: color 0.2s;
        }

        .g-delete-btn:hover { color: #EF8C5B; }

        .g-empty {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 300;
          color: #1e1e1e;
          text-align: center;
          padding: 80px 0;
          font-style: italic;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="g-wrap">

        {/* ── LEFT ── */}
        <div className="g-left">
          <div className="g-eyebrow">Life goals</div>
          <div className="g-title">What you're<br/>building<span>.</span></div>

          <div className="g-summary">
            <div className="g-sum-card">
              <div className="g-sum-val">{goals.length}</div>
              <div className="g-sum-lbl">Active</div>
            </div>
            <div className="g-sum-card">
              <div className="g-sum-val">
                {goals.filter(g => progressPct(g.milestones) === 100).length}
              </div>
              <div className="g-sum-lbl">Complete</div>
            </div>
          </div>

          <button className="g-add-btn" onClick={() => setShowForm(f => !f)}>
            {showForm ? '✕ Cancel' : '+ New goal'}
          </button>

          {showForm && (
            <div className="g-form">
              <input
                className="g-input"
                placeholder="Goal title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className="g-textarea"
                rows={2}
                placeholder="Why does this matter?"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
              <input
                className="g-input"
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                style={{ colorScheme: 'dark' }}
              />
              <div className="g-cats">
                {CATEGORIES.map(c => (
                  <button
                    key={c.id}
                    className={`g-cat-pill${form.category === c.id ? ' active' : ''}`}
                    style={{ '--cc': c.color }}
                    onClick={() => setForm(f => ({ ...f, category: c.id }))}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="g-form-btns">
                <button className="g-form-save" onClick={handleCreateGoal}>Save goal</button>
                <button className="g-form-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT ── */}
        <div className="g-right">
          <div className="g-section">Your goals</div>

          {loading ? (
            <div className="g-empty">Loading...</div>
          ) : goals.length === 0 ? (
            <div className="g-empty">No goals yet.<br/>Add your first one.</div>
          ) : (
            goals.map(goal => {
              const c = cat(goal.category);
              const pct = progressPct(goal.milestones);
              const dl = daysLeft(goal.deadline);
              const isExpanded = expandedGoal === goal.id;

              return (
                <div key={goal.id} className="g-card">
                  <div className="g-card-head" onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}>
                    <div className="g-card-color" style={{ background: c.color }} />
                    <div className="g-card-info">
                      <div className="g-card-cat" style={{ color: c.color }}>{c.label}</div>
                      <div className="g-card-title">{goal.title}</div>
                      <div className="g-progress-bar-bg">
                        <div
                          className="g-progress-bar-fill"
                          style={{ width: `${pct}%`, background: c.color }}
                        />
                      </div>
                    </div>
                    <div className="g-card-right">
                      <div className="g-pct">{pct}%</div>
                      {dl !== null && (
                        <div className={`g-deadline${dl < 0 ? ' done-dl' : dl <= 7 ? ' urgent' : ''}`}>
                          {dl < 0 ? 'overdue' : dl === 0 ? 'today' : `${dl}d left`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`g-card-body${isExpanded ? ' open' : ''}`}>
                    {goal.description && (
                      <div className="g-card-desc">{goal.description}</div>
                    )}

                    <div className="g-milestones">
                      {(goal.milestones || []).map(ms => (
                        <div
                          key={ms.id}
                          className={`g-ms${ms.done ? ' checked' : ''}`}
                          onClick={() => handleToggleMilestone(goal.id, ms.id, !ms.done)}
                        >
                          <div className={`g-ms-check${ms.done ? ' done' : ''}`}>
                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                              <path d="M1 3.5L3 5.5L8 1" stroke="#5BEF8C" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <span className="g-ms-label">{ms.title}</span>
                        </div>
                      ))}
                    </div>

                    <div className="g-ms-add">
                      <input
                        className="g-ms-input"
                        placeholder="Add a milestone..."
                        value={expandedGoal === goal.id ? newMilestone : ''}
                        onChange={e => setNewMilestone(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddMilestone(goal.id)}
                      />
                      <button
                        className="g-ms-add-btn"
                        onClick={() => handleAddMilestone(goal.id)}
                      >
                        + Add
                      </button>
                    </div>

                    <button className="g-delete-btn" onClick={() => handleDeleteGoal(goal.id)}>
                      Delete goal
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </>
  );
}
