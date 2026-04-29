import React from 'react';
import './NavBar.css';

const TABS = [
  { id: 'dashboard', icon: '⬡', label: 'HQ' },
  { id: 'log', icon: '◈', label: 'LOG' },
  { id: 'stats', icon: '◎', label: 'STATS' },
  { id: 'coach', icon: '◆', label: 'ARIA' },
];

export default function NavBar({ active, onNavigate }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {TABS.map(tab => (
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
      </div>
    </nav>
  );
}
