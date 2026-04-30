import React, { useState, useEffect, useRef } from 'react';
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

  const [playerState, setPlayerState] = useState({ currentTrack: null, playing: false });
  const ytRef = useRef(null);

  // ── THE FIX: audio lives here in App, never unmounts ──
  const audioRef = useRef(null);

  useEffect(() => {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const groqKey = process.env.REACT_APP_GROQ_API_KEY;
    if (!supabaseUrl || !groqKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
      setIsSetup(true);
    }
  }, []);

  // Sync audio src when track changes
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const newSrc = playerState.currentTrack?.audio_url || '';
    if (el.src !== newSrc) {
      el.src = newSrc;
    }
  }, [playerState.currentTrack?.audio_url]);

  // Sync play/pause
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!playerState.currentTrack?.audio_url) { el.pause(); return; }
    if (playerState.playing) el.play().catch(() => {});
    else el.pause();
  }, [playerState.playing, playerState.currentTrack?.audio_url]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current && playerState.volume !== undefined) {
      audioRef.current.volume = playerState.volume / 100;
    }
  }, [playerState.volume]);

  function handleLogDone() {
    setRefreshKey(k => k + 1);
    setView('dashboard');
  }

  function handlePlayerChange(changes) {
    setPlayerState(prev => ({ ...prev, ...changes }));
    if (changes.volume !== undefined && ytRef.current) {
      try {
        ytRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'setVolume', args: [changes.volume] }),
          '*'
        );
      } catch(e) {}
    }
  }

  if (isSetup) return <Setup />;

  return (
    <div className="app">
      <div className="noise-overlay" />

      {/* Persistent audio element for uploaded files — never unmounts */}
      <audio
        ref={audioRef}
        style={{ display: 'none' }}
        onEnded={() => handlePlayerChange({ _audioEnded: true })}
      />

      {/* Hidden YouTube player */}
      {playerState.currentTrack && playerState.playing && playerState.currentTrack.youtubeId && !playerState.currentTrack.audio_url && (
        <div style={{ position: 'fixed', width: 1, height: 1, overflow: 'hidden', opacity: 0, top: -999, left: -999, pointerEvents: 'none' }}>
          <iframe
            key={playerState.currentTrack.youtubeId}
            src={`https://www.youtube.com/embed/${playerState.currentTrack.youtubeId}?autoplay=1&controls=0&modestbranding=1&enablejsapi=1`}
            allow="autoplay"
            ref={ytRef}
            title="bg-player"
            style={{ width: 1, height: 1, border: 'none' }}
          />
        </div>
      )}

      {/* Mini now-playing pill */}
      {playerState.currentTrack && view !== 'music' && view !== 'coach' && (
        <div
          className={`global-player-pill ${playerState.playing ? 'gp--playing' : ''}`}
          style={{ '--gp-color': playerState.currentTrack.color || '#C8A96E' }}
          onClick={() => setView('music')}
        >
          {/* Blurred bg art */}
          {playerState.currentTrack.thumb && (
            <div className="gp-bg-art" style={{ backgroundImage: `url(${playerState.currentTrack.thumb})` }} />
          )}
          <div className="gp-bg-overlay" />

          {/* Top glow line */}
          <div className="gp-glow-line" />

          {/* Thumb */}
          {playerState.currentTrack.thumb
            ? <img src={playerState.currentTrack.thumb} alt="" className="gp-thumb" />
            : <div className="gp-thumb gp-thumb--audio">♪</div>
          }

          {/* Info + progress */}
          <div className="gp-info">
            <div className="gp-marquee-wrap">
              <span className={`gp-title ${playerState.currentTrack.title?.length > 22 ? 'gp-title--scroll' : ''}`}>
                {playerState.currentTrack.title}
              </span>
            </div>
            <div className="gp-meta">
              {playerState.playing
                ? <span className="gp-live-dot" style={{ background: playerState.currentTrack.color || '#C8A96E' }} />
                : <span className="gp-paused-icon">⏸</span>
              }
              <span className="gp-artist">{playerState.currentTrack.artist}</span>
            </div>
          </div>

          {/* EQ bars when playing */}
          {playerState.playing && (
            <div className="gp-eq">
              {[1,2,3,4].map(i => (
                <div key={i} className="gp-eq-bar" style={{ '--c': playerState.currentTrack.color || '#C8A96E', animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}

          {/* Play/pause button */}
          <button
            className="gp-play"
            onClick={e => { e.stopPropagation(); handlePlayerChange({ playing: !playerState.playing }); }}
          >
            <div className="gp-play-ring" />
            <span className="gp-play-icon">{playerState.playing ? '⏸' : '▶'}</span>
          </button>
        </div>
      )}

      <div className="app-content">
        {view === 'dashboard' && <Dashboard key={refreshKey} onNavigate={setView} />}
        {view === 'log' && <HabitLog onDone={handleLogDone} />}
        {view === 'stats' && <Stats />}
        {view === 'coach' && <AICoach />}

        {/* Music stays ALWAYS mounted — just hidden when not active.
            This prevents the component (and its state) from being destroyed. */}
        <div style={{ display: view === 'music' ? 'block' : 'none' }}>
          <Music
            playerState={playerState}
            onPlayerChange={handlePlayerChange}
            audioRef={audioRef}
          />
        </div>
      </div>

      <NavBar active={view} onNavigate={setView} playerState={playerState} />
    </div>
  );
}

export default App;
