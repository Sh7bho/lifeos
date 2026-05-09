import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ── Supabase helpers ─────────────────────────────────────────────────────────

export async function saveJournalEntry({ content }) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('journal_entries')
    .upsert(
      { date: today, content, updated_at: new Date().toISOString() },
      { onConflict: 'date' }
    )
    .select();
  if (error) throw error;
  return data;
}

export async function getTodayJournal() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('date', today)
    .single();
  return data;
}

export async function getRecentJournals(days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ── Prompts ──────────────────────────────────────────────────────────────────

const PROMPTS = [
  "What's actually on your mind right now?",
  "What did you do today that your future self will thank you for?",
  "What's one thing you're avoiding and why?",
  "What would make today a win?",
  "What are you learning about yourself lately?",
  "What's draining you? What's fuelling you?",
  "What do you want to be true about yourself in 90 days?",
];

// ── Component ────────────────────────────────────────────────────────────────

export default function Journal({ onDone }) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [prompt] = useState(() => PROMPTS[new Date().getDay() % PROMPTS.length]);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [today, recent] = await Promise.all([
          getTodayJournal(),
          getRecentJournals(7),
        ]);
        if (today) {
          setExisting(today);
          setContent(today.content || '');
          setWordCount((today.content || '').split(/\s+/).filter(Boolean).length);
        }
        setRecentEntries(recent);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleChange(e) {
    const val = e.target.value;
    setContent(val);
    setWordCount(val.split(/\s+/).filter(Boolean).length);
    setSaved(false);
  }

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await saveJournalEntry({ content });
      setSaved(true);
      setTimeout(() => onDone?.(), 1000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Mono:wght@300;400&family=Syne:wght@600;700;800&display=swap');

        .j-wrap {
          min-height: 100vh;
          background: #0c0c0c;
          color: #e8e3da;
          font-family: 'Syne', sans-serif;
          display: grid;
          grid-template-columns: 1fr 340px;
        }

        /* LEFT — editor */
        .j-editor {
          padding: 52px 56px 60px;
          border-right: 1px solid #141414;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          animation: fadeUp 0.4s 0.05s both;
        }

        .j-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
        }

        .j-date {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          color: #333;
          text-transform: uppercase;
        }

        .j-wordcount {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: #222;
          letter-spacing: 0.08em;
          transition: color 0.3s;
        }

        .j-wordcount.active { color: #C8A95A; }

        .j-prompt {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          font-style: italic;
          color: #2e2e2e;
          letter-spacing: 0.03em;
          margin-bottom: 28px;
          padding-left: 14px;
          border-left: 2px solid #1a1a1a;
          line-height: 1.5;
        }

        .j-textarea {
          flex: 1;
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #d8d3ca;
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 300;
          line-height: 1.75;
          letter-spacing: 0.01em;
          resize: none;
          caret-color: #C8A95A;
          min-height: 400px;
        }

        .j-textarea::placeholder {
          color: #1e1e1e;
          font-style: italic;
        }

        .j-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 28px;
          border-top: 1px solid #141414;
          margin-top: 28px;
        }

        .j-footer-meta {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #222;
          letter-spacing: 0.1em;
        }

        .j-save {
          padding: 12px 28px;
          border: none;
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }

        .j-save:not(:disabled) { background: #C8A95A; color: #0c0c0c; }
        .j-save:disabled { background: #111; color: #222; cursor: not-allowed; }
        .j-save.done { background: #5BEF8C; color: #0c0c0c; }
        .j-save:not(:disabled):hover { opacity: 0.88; }
        .j-save:not(:disabled):active { transform: scale(0.98); }

        /* RIGHT — past entries */
        .j-sidebar {
          padding: 52px 32px 60px;
          display: flex;
          flex-direction: column;
          animation: fadeUp 0.4s 0.15s both;
        }

        .j-sidebar-title {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.25em;
          color: #222;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        .j-entry-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .j-entry-item {
          padding: 14px 16px;
          border-radius: 12px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
        }

        .j-entry-item:hover { background: #0f0f0f; border-color: #161616; }
        .j-entry-item.active { background: #0f0f0f; border-color: #1e1e1e; }

        .j-entry-date {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          color: #333;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .j-entry-preview {
          font-family: 'Cormorant Garamond', serif;
          font-size: 15px;
          font-weight: 300;
          color: #444;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .j-entry-words {
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          color: #222;
          margin-top: 6px;
          letter-spacing: 0.08em;
        }

        /* MODAL for reading past entry */
        .j-modal-bg {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          animation: fadeUp 0.2s both;
        }

        .j-modal {
          background: #0f0f0f;
          border: 1px solid #1e1e1e;
          border-radius: 20px;
          padding: 40px 48px;
          max-width: 640px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        }

        .j-modal-date {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          color: #333;
          text-transform: uppercase;
          margin-bottom: 24px;
        }

        .j-modal-content {
          font-family: 'Cormorant Garamond', serif;
          font-size: 21px;
          font-weight: 300;
          color: #888;
          line-height: 1.8;
          white-space: pre-wrap;
        }

        .j-modal-close {
          position: absolute;
          top: 20px;
          right: 24px;
          background: none;
          border: none;
          color: #333;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          letter-spacing: 0.1em;
          transition: color 0.2s;
        }

        .j-modal-close:hover { color: #888; }

        .j-empty {
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 300;
          color: #1e1e1e;
          text-align: center;
          padding: 40px 0;
          font-style: italic;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {selectedEntry && (
        <div className="j-modal-bg" onClick={() => setSelectedEntry(null)}>
          <div className="j-modal" onClick={e => e.stopPropagation()}>
            <div className="j-modal-date">
              {new Date(selectedEntry.date + 'T00:00:00').toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </div>
            <div className="j-modal-content">{selectedEntry.content}</div>
            <button className="j-modal-close" onClick={() => setSelectedEntry(null)}>
              close ↑
            </button>
          </div>
        </div>
      )}

      <div className="j-wrap">

        {/* ── EDITOR ── */}
        <div className="j-editor">
          <div className="j-top">
            <div>
              <div className="j-date">{todayStr}</div>
              {existing && (
                <div style={{
                  fontFamily: 'DM Mono, monospace', fontSize: 9,
                  color: '#C8A95A', letterSpacing: '0.15em',
                  marginTop: 4, textTransform: 'uppercase'
                }}>
                  ● Updating today's entry
                </div>
              )}
            </div>
            <div className={`j-wordcount${wordCount > 0 ? ' active' : ''}`}>
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </div>
          </div>

          <div className="j-prompt">"{prompt}"</div>

          <textarea
            className="j-textarea"
            placeholder="Start writing..."
            value={content}
            onChange={handleChange}
            autoFocus
          />

          <div className="j-footer">
            <div className="j-footer-meta">
              {saved ? '✓ saved' : 'unsaved'}
            </div>
            <button
              className={`j-save${saved ? ' done' : ''}`}
              disabled={!content.trim() || saving}
              onClick={handleSave}
            >
              {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save entry →'}
            </button>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="j-sidebar">
          <div className="j-sidebar-title">Past entries</div>

          {loading ? (
            <div className="j-empty">Loading...</div>
          ) : recentEntries.length === 0 ? (
            <div className="j-empty">No past entries yet.</div>
          ) : (
            <div className="j-entry-list">
              {recentEntries.map(entry => {
                const isToday = entry.date === new Date().toISOString().split('T')[0];
                const words = entry.content.split(/\s+/).filter(Boolean).length;
                return (
                  <div
                    key={entry.date}
                    className={`j-entry-item${selectedEntry?.date === entry.date ? ' active' : ''}`}
                    onClick={() => !isToday && setSelectedEntry(entry)}
                    style={{ cursor: isToday ? 'default' : 'pointer' }}
                  >
                    <div className="j-entry-date">
                      {isToday ? 'Today' : new Date(entry.date + 'T00:00:00').toLocaleDateString('en-GB', {
                        weekday: 'short', day: 'numeric', month: 'short'
                      })}
                    </div>
                    <div className="j-entry-preview">{entry.content}</div>
                    <div className="j-entry-words">{words} words</div>
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
