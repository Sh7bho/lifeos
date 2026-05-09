import React, { useState, useRef, useEffect } from 'react';

// 5 primary tabs always visible
const PRIMARY_TABS = [
  { id: 'dashboard', icon: '⬡', label: 'HQ' },
  { id: 'log',       icon: '◈', label: 'LOG' },
  { id: 'music',     icon: '♪', label: 'SOUND' },
  { id: 'coach',     icon: '◆', label: 'ARIA' },
  { id: 'stats',     icon: '◎', label: 'STATS' },
];

// Secondary tabs in a clean popover
const SECONDARY_TABS = [
  { id: 'mood',    icon: '◉', label: 'MOOD',    color: '#5B8DEF' },
  { id: 'journal', icon: '✦', label: 'JOURNAL', color: '#EF8C5B' },
  { id: 'focus',   icon: '◷', label: 'FOCUS',   color: '#5BEF8C' },
  { id: 'goals',   icon: '◇', label: 'GOALS',   color: '#C45BEF' },
];

const SECONDARY_IDS = SECONDARY_TABS.map(t => t.id);

export default function NavBar({ active, onNavigate, learnMode, onLearnToggle }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    if (!moreOpen) return;
    function onOutside(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [moreOpen]);

  function nav(id) {
    onNavigate(id);
    setMoreOpen(false);
  }

  const isSecondaryActive = SECONDARY_IDS.includes(active);

  return (
    <>
      <style>{`
        .nb {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 50;
          padding-bottom: env(safe-area-inset-bottom);
          background: rgba(8,8,8,0.96);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid #161616;
        }
        .nb-inner {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          padding: 10px 8px 12px;
          max-width: 500px;
          margin: 0 auto;
          position: relative;
        }

        /* ── Primary tab ── */
        .nb-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 10px;
          border-radius: 10px;
          transition: background 0.15s;
          min-width: 44px;
        }
        .nb-tab:hover { background: #111; }
        .nb-icon {
          font-size: 17px;
          line-height: 1;
          color: #2c2c2c;
          transition: color 0.2s;
        }
        .nb-label {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.15em;
          color: #2a2a2a;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .nb-tab--active .nb-icon { color: #e8e3da; }
        .nb-tab--active .nb-label { color: #C8A95A; }
        .nb-dot {
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 3px; height: 3px;
          border-radius: 50%;
          background: #C8A95A;
        }

        /* ── More button ── */
        .nb-more-wrap { position: relative; }
        .nb-more {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 10px;
          border-radius: 10px;
          transition: background 0.15s;
          min-width: 44px;
        }
        .nb-more:hover { background: #111; }
        .nb-more-icon {
          width: 17px; height: 17px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; line-height: 1;
          color: #2c2c2c;
          transition: color 0.2s, transform 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .nb-more--active .nb-more-icon { color: #C8A95A; transform: rotate(45deg); }
        .nb-more--secondary .nb-more-icon { color: #C8A95A; }
        .nb-more-label {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.15em;
          color: #2a2a2a;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .nb-more--active .nb-more-label,
        .nb-more--secondary .nb-more-label { color: #C8A95A; }

        /* ── Popover ── */
        .nb-popover {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%) translateY(6px);
          background: #0e0e0e;
          border: 1px solid #1e1e1e;
          border-radius: 14px;
          padding: 6px;
          display: flex;
          gap: 2px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.18s, transform 0.18s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 -4px 32px rgba(0,0,0,0.7);
          white-space: nowrap;
          z-index: 60;
        }
        .nb-popover.open {
          opacity: 1;
          pointer-events: all;
          transform: translateX(-50%) translateY(0);
        }
        .nb-pop-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 13px;
          border-radius: 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background 0.12s;
        }
        .nb-pop-item:hover { background: #151515; }
        .nb-pop-item.active { background: #141414; }
        .nb-pop-icon {
          font-size: 16px; line-height: 1;
          color: #2e2e2e;
          transition: color 0.12s;
        }
        .nb-pop-item:hover .nb-pop-icon,
        .nb-pop-item.active .nb-pop-icon { color: var(--pc); }
        .nb-pop-label {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.12em;
          color: #2a2a2a;
          text-transform: uppercase;
          transition: color 0.12s;
        }
        .nb-pop-item.active .nb-pop-label { color: var(--pc); }
      `}</style>

      <nav className="nb">
        <div className="nb-inner">
          {PRIMARY_TABS.map(tab => (
            <button
              key={tab.id}
              className={`nb-tab${active === tab.id ? ' nb-tab--active' : ''}`}
              onClick={() => nav(tab.id)}
            >
              <span className="nb-icon">{tab.icon}</span>
              <span className="nb-label">{tab.label}</span>
              {active === tab.id && <span className="nb-dot" />}
            </button>
          ))}

          {/* MORE */}
          <div className="nb-more-wrap" ref={moreRef}>
            <div className={`nb-popover${moreOpen ? ' open' : ''}`}>
              {SECONDARY_TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`nb-pop-item${active === tab.id ? ' active' : ''}`}
                  style={{ '--pc': tab.color }}
                  onClick={() => nav(tab.id)}
                >
                  <span className="nb-pop-icon">{tab.icon}</span>
                  <span className="nb-pop-label">{tab.label}</span>
                </button>
              ))}
            </div>
            <button
              className={`nb-more${moreOpen ? ' nb-more--active' : ''}${isSecondaryActive && !moreOpen ? ' nb-more--secondary' : ''}`}
              onClick={() => setMoreOpen(o => !o)}
            >
              <span className="nb-more-icon">+</span>
              <span className="nb-more-label">MORE</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
