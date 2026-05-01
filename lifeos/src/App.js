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

  // Audio element for uploaded files — never unmounts
  const audioRef = useRef(null);

  // YouTube IFrame Player API
  const ytPlayerRef = useRef(null);       // YT.Player instance
  const ytContainerRef = useRef(null);    // div the player mounts into
  const ytApiReady = useRef(false);
  const ytPendingRef = useRef(null);      // track to load once API is ready
  const onYtEndedRef = useRef(null);      // callback set by Music.js via playerState

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (window.YT && window.YT.Player) { ytApiReady.current = true; return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      ytApiReady.current = true;
      if (ytPendingRef.current) {
        loadYTTrack(ytPendingRef.current);
        ytPendingRef.current = null;
      }
    };
  }, []);

  function loadYTTrack(track) {
    if (!ytApiReady.current) { ytPendingRef.current = track; return; }
    if (!track?.youtubeId) return;

    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      ytPlayerRef.current.loadVideoById(track.youtubeId);
    } else {
      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        height: '1',
        width: '1',
        videoId: track.youtubeId,
        playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: (e) => {
            e.target.setVolume(playerState.volume ?? 80);
            e.target.playVideo();
          },
          onStateChange: (e) => {
            // YT.PlayerState.ENDED === 0
            if (e.data === 0) {
              // Tell Music.js a YouTube track ended
              setPlayerState(prev => ({ ...prev, _ytEnded: Date.now() }));
            }
          },
        },
      });
    }
  }

  // When track changes — load into YT player or audio element
  useEffect(() => {
    const track = playerState.currentTrack;
    const el = audioRef.current;

    if (!track) {
      // Stop everything
      el?.pause();
      ytPlayerRef.current?.pauseVideo?.();
      return;
    }

    if (track.audio_url) {
      // Uploaded file — use audio element
      ytPlayerRef.current?.pauseVideo?.();
      if (el && el.src !== track.audio_url) el.src = track.audio_url;
    } else if (track.youtubeId) {
      // YouTube — use IFrame API
      el?.pause();
      loadYTTrack(track);
    }
  }, [playerState.currentTrack?.audio_url, playerState.currentTrack?.youtubeId]);

  // Play / pause sync
  useEffect(() => {
    const track = playerState.currentTrack;
    const el = audioRef.current;
    if (!track) return;

    if (track.audio_url) {
      if (playerState.playing) el?.play().catch(() => {});
      else el?.pause();
    } else if (track.youtubeId) {
      if (playerState.playing) ytPlayerRef.current?.playVideo?.();
      else ytPlayerRef.current?.pauseVideo?.();
    }
  }, [playerState.playing, playerState.currentTrack?.audio_url, playerState.currentTrack?.youtubeId]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current && playerState.volume !== undefined) {
      audioRef.current.volume = playerState.volume / 100;
    }
    if (ytPlayerRef.current?.setVolume && playerState.volume !== undefined) {
      ytPlayerRef.current.setVolume(playerState.volume);
    }
  }, [playerState.volume]);

  function handleLogDone() {
    setRefreshKey(k => k + 1);
    setView('dashboard');
  }

  function handlePlayerChange(changes) {
    setPlayerState(prev => ({ ...prev, ...changes }));
    // YouTube repeat — seek to 0 and replay
    if (changes._ytRepeat && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(0);
      ytPlayerRef.current.playVideo();
    }
  }

  if (isSetup) return <Setup />;

  return (
    <div className="app">
      <div className="noise-overlay" />

      {/* Persistent audio element for uploaded files */}
      <audio
        ref={audioRef}
        style={{ display: 'none' }}
        onEnded={() => handlePlayerChange({ _audioEnded: Date.now() })}
      />

      {/* YouTube IFrame API container — always mounted, never re-creates the player */}
      <div
        style={{ position: 'fixed', width: 1, height: 1, overflow: 'hidden', opacity: 0, top: -999, left: -999, pointerEvents: 'none' }}
      >
        <div ref={ytContainerRef} id="yt-player-container" />
      </div>

      {/* Mini now-playing pill */}
      {playerState.currentTrack && view !== 'music' && view !== 'coach' && (
        <div
          className={`global-player-pill ${playerState.playing ? 'gp--playing' : ''}`}
          style={{ '--gp-color': playerState.currentTrack.color || '#C8A96E' }}
          onClick={() => setView('music')}
        >
          {playerState.currentTrack.thumb && (
            <div className="gp-bg-art" style={{ backgroundImage: `url(${playerState.currentTrack.thumb})` }} />
          )}
          <div className="gp-bg-overlay" />
          <div className="gp-glow-line" />

          {playerState.currentTrack.thumb
            ? <img src={playerState.currentTrack.thumb} alt="" className="gp-thumb" />
            : <div className="gp-thumb gp-thumb--audio">♪</div>
          }

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

          {playerState.playing && (
            <div className="gp-eq">
              {[1,2,3,4].map(i => (
                <div key={i} className="gp-eq-bar" style={{ '--c': playerState.currentTrack.color || '#C8A96E', animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}

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
