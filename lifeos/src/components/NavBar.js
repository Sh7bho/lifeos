import React from 'react';
import './NavBar.css';

const TABS = [
  { id: 'dashboard', icon: '⬡', label: 'HQ' },
  { id: 'log', icon: '◈', label: 'LOG' },
  { id: 'stats', icon: '◎', label: 'STATS' },
  { id: 'music', icon: '♪', label: 'SOUND' },
  { id: 'coach', icon: '◆', label: 'ARIA' },
];

export default function NavBar({ active, onNavigate, learnMode, onLearnToggle }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`nav-item ${active === tab.id && !learnMode ? 'nav-item--active' : ''}`}
            onClick={() => onNavigate(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
            {active === tab.id && !learnMode && <span className="nav-dot" />}
          </button>
        ))}

        {/* Learn Mode toggle */}
        <button
          className={`nav-item nav-item--learn ${learnMode ? 'nav-item--learn-active' : ''}`}
          onClick={onLearnToggle}
        >
          <span className="nav-icon nav-icon--learn">{learnMode ? '✕' : '◑'}</span>
          <span className="nav-label">{learnMode ? 'EXIT' : 'LEARN'}</span>
          {learnMode && <span className="nav-dot nav-dot--learn" />}
        </button>
      </div>
    </nav>
  );
}
