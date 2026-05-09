import React, { useState, useRef, useEffect } from 'react';
import './NavBar.css';

// Core nav tabs — always visible
const CORE_TABS = [
  { id: 'dashboard', icon: '⬡', label: 'HQ' },
  { id: 'stats',     icon: '◎', label: 'STATS' },
  { id: 'music',     icon: '♪', label: 'SOUND' },
  { id: 'coach',     icon: '◆', label: 'ARIA' },
];

// Extra tabs in the "+" tray
const TRAY_TABS = [
  { id: 'log',     icon: '◈', label: 'LOG',    color: '#C8A95A' },
  { id: 'mood',    icon: '◉', label: 'MOOD',   color: '#5B8DEF' },
  { id: 'journal', icon: '✦', label: 'JOURNAL',color: '#EF8C5B' },
  { id: 'focus',   icon: '◷', label: 'FOCUS',  color: '#5BEF8C' },
  { id: 'goals',   icon: '◇', label: 'GOALS',  color: '#C45BEF' },
];

export default function NavBar({ active, onNavigate, learnMode, onLearnToggle }) {
  const [trayOpen, setTrayOpen] = useState(false);
  const trayRef = useRef(null);

  // Close tray when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (trayRef.current && !trayRef.current.contains(e.target)) {
        setTrayOpen(false);
      }
    }
    if (trayOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [trayOpen]);

  // Close tray after navigating
  function handleTrayNav(id) {
    onNavigate(id);
    setTrayOpen(false);
  }

  const isTrayActive = TRAY_TABS.some(t => t.id === active);

  return (
    <>
      <style>{`
        .navbar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          padding: 0 0 env(safe-area-inset-bottom);
          background: rgba(10,10,10,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid #161616;
        }

        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 8px 16px 10px;
          max-width: 640px;
          margin: 0 auto;
          position: relative;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 10px;
          transition: background 0.15s;
          position: relative;
        }

        .nav-item:hover { background: #111; }

        .nav-icon {
          font-size: 18px;
          line-height: 1;
          color: #2e2e2e;
          transition: color 0.2s;
        }

        .nav-label {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.15em;
          color: #2a2a2a;
          text-transform: uppercase;
          transition: color 0.2s;
        }

        .nav-dot {
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #C8A95A;
        }

        .nav-item--active .nav-icon { color: #e8e3da; }
        .nav-item--active .nav-label { color: #C8A95A; }

        /* PLUS BUTTON */
        .nav-plus {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid #1e1e1e;
          background: #111;
          color: #444;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          line-height: 1;
          flex-direction: column;
          gap: 3px;
          padding: 0;
          position: relative;
        }

        .nav-plus.tray-active {
          border-color: #C8A95A;
          color: #C8A95A;
          background: rgba(200,169,90,0.08);
        }

        .nav-plus:hover { border-color: #2a2a2a; color: #666; }

        .nav-plus-icon {
          font-size: 18px;
          line-height: 1;
          transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
          display: block;
        }

        .nav-plus.open .nav-plus-icon { transform: rotate(45deg); }

        .nav-plus-label {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.12em;
          color: #2a2a2a;
          text-transform: uppercase;
        }

        /* TRAY */
        .nav-tray {
          position: absolute;
          bottom: calc(100% + 12px);
          left: 50%;
          transform: translateX(-50%);
          background: #0f0f0f;
          border: 1px solid #1e1e1e;
          border-radius: 16px;
          padding: 8px;
          display: flex;
          gap: 4px;
          opacity: 0;
          pointer-events: none;
          transform: translateX(-50%) translateY(8px);
          transition: opacity 0.2s, transform 0.2s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 -8px 40px rgba(0,0,0,0.6);
          white-space: nowrap;
        }

        .nav-tray.open {
          opacity: 1;
          pointer-events: all;
          transform: translateX(-50%) translateY(0);
        }

        .tray-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 14px;
          border-radius: 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background 0.15s;
        }

        .tray-item:hover { background: #141414; }

        .tray-item.active {
          background: #141414;
        }

        .tray-icon {
          font-size: 17px;
          line-height: 1;
          color: #333;
          transition: color 0.15s;
        }

        .tray-item.active .tray-icon,
        .tray-item:hover .tray-icon { color: var(--tc); }

        .tray-label {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.12em;
          color: #2a2a2a;
          text-transform: uppercase;
          transition: color 0.15s;
        }

        .tray-item.active .tray-label { color: var(--tc); }

        /* LEARN BUTTON */
        .nav-learn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 10px;
          transition: background 0.15s;
        }

        .nav-learn:hover { background: #111; }

        .nav-learn-icon {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          background: ${learnMode ? '#7C5CBF' : '#1a1a1a'};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          transition: background 0.2s;
          color: ${learnMode ? '#fff' : '#333'};
        }

        .nav-learn-label {
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: 0.15em;
          color: ${learnMode ? '#7C5CBF' : '#2a2a2a'};
          text-transform: uppercase;
          transition: color 0.2s;
        }
      `}</style>

      <nav className="navbar">
        <div className="navbar-inner" ref={trayRef}>

          {/* CORE TABS */}
          {CORE_TABS.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${active === tab.id ? 'nav-item--active' : ''}`}
              onClick={() => onNavigate(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
              {active === tab.id && <span className="nav-dot" />}
            </button>
          ))}

          {/* PLUS — tray toggle */}
          <div style={{ position: 'relative' }}>
            <div className={`nav-tray${trayOpen ? ' open' : ''}`}>
              {TRAY_TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`tray-item${active === tab.id ? ' active' : ''}`}
                  style={{ '--tc': tab.color }}
                  onClick={() => handleTrayNav(tab.id)}
                >
                  <span className="tray-icon">{tab.icon}</span>
                  <span className="tray-label">{tab.label}</span>
                </button>
              ))}
            </div>

            <button
              className={`nav-plus${trayOpen ? ' open' : ''}${isTrayActive ? ' tray-active' : ''}`}
              onClick={() => setTrayOpen(o => !o)}
            >
              <span className="nav-plus-icon">+</span>
            </button>
          </div>

          {/* LEARN */}
          <button className="nav-learn" onClick={onLearnToggle}>
            <div className="nav-learn-icon">⬡</div>
            <span className="nav-learn-label">LEARN</span>
          </button>

        </div>
      </nav>
    </>
  );
}
