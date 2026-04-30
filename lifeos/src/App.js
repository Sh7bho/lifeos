import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import HabitLog from './components/HabitLog';
import Stats from './components/Stats';
import AICoach from './components/AICoach';
import Music from './components/Music';
import Setup from './components/Setup';
import NavBar from './components/NavBar';
import './App.css';

function App() {
  const [view, setView] = useState('dashboard');
  const [isSetup, setIsSetup] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Global player state — persists when switching tabs
  const [playerState, setPlayerState] = useState({ currentTrack: null, playing: false });

  useEffect(() => {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const groqKey = process.env.REACT_APP_GROQ_API_KEY;
    if (!supabaseUrl || !groqKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
      setIsSetup(true);
    }
  }, []);

  function handleLogDone() {
    setRefreshKey(k => k + 1);
    setView('dashboard');
  }

  function handlePlayerChange(changes) {
    setPlayerState(prev => ({ ...prev, ...changes }));
  }

  if (isSetup) return <Setup />;

  return (
    <div className="app">
      <div className="noise-overlay" />

      {/* Hidden YouTube player — keeps playing across all views, only for YT tracks */}
      {playerState.currentTrack && playerState.playing && playerState.currentTrack.youtubeId && !playerState.currentTrack.audio_url && (
        <div style={{ position: 'fixed', width: 1, height: 1, overflow: 'hidden', opacity: 0, top: -999, left: -999, pointerEvents: 'none' }}>
          <iframe
            key={playerState.currentTrack.youtubeId}
            src={`https://www.youtube.com/embed/${playerState.currentTrack.youtubeId}?autoplay=1&controls=0&modestbranding=1`}
            allow="autoplay"
            title="bg-player"
            style={{ width: 1, height: 1, border: 'none' }}
          />
        </div>
      )}

      {/* Mini now-playing pill — visible on all views except music tab */}
      {playerState.currentTrack && view !== 'music' && (
        <div
          className="global-player-pill"
          style={{ '--gp-color': playerState.currentTrack.color }}
          onClick={() => setView('music')}
        >
          <div className="gp-info">
            <img src={playerState.currentTrack.thumb} alt="" className="gp-thumb" />
            <span className="gp-title">{playerState.currentTrack.title}</span>
          </div>
          <button
            className="gp-play"
            style={{ color: playerState.currentTrack.color }}
            onClick={e => { e.stopPropagation(); handlePlayerChange({ playing: !playerState.playing }); }}
          >
            {playerState.playing ? '⏸' : '▶'}
          </button>
        </div>
      )}

      <div className="app-content">
        {view === 'dashboard' && <Dashboard key={refreshKey} onNavigate={setView} />}
        {view === 'log' && <HabitLog onDone={handleLogDone} />}
        {view === 'stats' && <Stats />}
        {view === 'coach' && <AICoach />}
        {view === 'music' && (
          <Music playerState={playerState} onPlayerChange={handlePlayerChange} />
        )}
      </div>
      <NavBar active={view} onNavigate={setView} playerState={playerState} />
    </div>
  );
}

export default App;
