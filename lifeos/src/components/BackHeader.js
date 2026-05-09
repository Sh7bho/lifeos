import React from 'react';

/**
 * BackHeader — drop this at the top of any full-screen view.
 *
 * Usage:
 *   <BackHeader title="Journal" onBack={() => onNavigate('dashboard')} />
 *
 * Props:
 *   title     — string shown in the center
 *   onBack    — function called when ← is tapped
 *   right     — optional JSX for a right-side action (e.g. a save button)
 *   accent    — optional color for the title (default #C8A95A)
 */
export default function BackHeader({ title, onBack, right, accent = '#C8A95A' }) {
  return (
    <>
      <style>{`
        .bh {
          position: sticky;
          top: 0;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px 14px;
          background: rgba(8,8,8,0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #141414;
        }
        .bh-back {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 10px 6px 6px;
          border-radius: 8px;
          transition: background 0.15s;
          color: #555;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .bh-back:hover { background: #111; color: #888; }
        .bh-back-arrow {
          font-size: 16px;
          line-height: 1;
          transition: transform 0.15s;
        }
        .bh-back:hover .bh-back-arrow { transform: translateX(-2px); }
        .bh-title {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--bh-accent);
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
        }
        .bh-right {
          display: flex;
          align-items: center;
        }
      `}</style>
      <header className="bh" style={{ '--bh-accent': accent }}>
        <button className="bh-back" onClick={onBack}>
          <span className="bh-back-arrow">←</span>
          Back
        </button>
        <span className="bh-title">{title}</span>
        <div className="bh-right">{right || null}</div>
      </header>
    </>
  );
}
