import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import HabitLog from './components/HabitLog';
import Stats from './components/Stats';
import AICoach from './components/AICoach';
import Music from './components/Music';
import Setup from './components/Setup';
import NavBar from './components/NavBar';
import LearnOS from './components/LearnOS';
import MoodLog from './components/MoodLog';
import Journal from './components/Journal';
import FocusTimer from './components/FocusTimer';
import Goals from './components/Goals';
import './App.css';

const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAAABkYXRhAAAAAA==';

function App() {
  const [view, setView] = useState('dashboard');
  const [isSetup, setIsSetup] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [learnMode, setLearnMode] = useState(false);
  const [playerState, setPlayerState] = useState({ currentTrack: null, playing: false });
  const audioRef = useRef(null);
  const keepaliveRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const ytApiReady = useRef(false);
  const ytPendingRef = useRef(null);

  // ── YouTube IFrame API ──────────────────────────────────────────────────────
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
        height: '1', width: '1', videoId: track.youtubeId,
        playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: (e) => { e.target.setVolume(playerState.volume ?? 80); e.target.playVideo(); },
          onStateChange: (e) => {
            if (e.data === 0) setPlayerState(prev => ({ ...prev, _ytEnded: Date.now() }));
          },
        },
      });
    }
  }

  // ── Track / play / volume sync ──────────────────────────────────────────────
  useEffect(() => {
    const track = playerState.currentTrack;
    const el = audioRef.current;
    if (!track) { el?.pause(); ytPlayerRef.current?.pauseVideo?.(); stopKeepalive(); return; }
    if (track.audio_url) {
      ytPlayerRef.current?.pauseVideo?.(); stopKeepalive();
      if (el && el.src !== track.audio_url) el.src = track.audio_url;
    } else if (track.youtubeId) {
      el?.pause(); loadYTTrack(track); startKeepalive();
    }
  }, [playerState.currentTrack?.audio_url, playerState.currentTrack?.youtubeId]);

  useEffect(() => {
    const track = playerState.currentTrack;
    const el = audioRef.current;
    if (!track) return;
    if (track.audio_url) {
      if (playerState.playing) el?.play().catch(() => {}); else el?.pause();
    } else if (track.youtubeId) {
      if (playerState.playing) { ytPlayerRef.current?.playVideo?.(); startKeepalive(); }
      else { ytPlayerRef.current?.pauseVideo?.(); stopKeepalive(); }
    }
  }, [playerState.playing, playerState.currentTrack?.audio_url, playerState.currentTrack?.youtubeId]);

  useEffect(() => {
    if (audioRef.current && playerState.volume !== undefined)
      audioRef.current.volume = playerState.volume / 100;
    if (ytPlayerRef.current?.setVolume && playerState.volume !== undefined)
      ytPlayerRef.current.setVolume(playerState.volume);
  }, [playerState.volume]);

  // ── iOS keepalive ───────────────────────────────────────────────────────────
  function startKeepalive() {
    const el = keepaliveRef.current;
    if (!el || !el.paused) return;
    el.play().catch(() => {});
  }
  function stopKeepalive() {
    const el = keepaliveRef.current;
    if (!el || el.paused) return;
    el.pause(); el.currentTime = 0;
  }

  // ── Media Session API ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const track = playerState.currentTrack;
    if (!track) { navigator.mediaSession.playbackState = 'none'; return; }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || 'Unknown', artist: track.artist || '', album: '',
      artwork: track.thumb ? [
        { src: track.thumb, sizes: '320x180', type: 'image/jpeg' },
        { src: track.thumb, sizes: '640x360', type: 'image/jpeg' },
      ] : [],
    });
    navigator.mediaSession.playbackState = playerState.playing ? 'playing' : 'paused';
    navigator.mediaSession.setActionHandler('play', () => handlePlayerChange({ playing: true }));
    navigator.mediaSession.setActionHandler('pause', () => handlePlayerChange({ playing: false }));
    navigator.mediaSession.setActionHandler('stop', () => handlePlayerChange({ currentTrack: null, playing: false }));
    navigator.mediaSession.setActionHandler('nexttrack', () => handlePlayerChange({ _skipNext: Date.now() }));
    navigator.mediaSession.setActionHandler('previoustrack', () => handlePlayerChange({ _skipPrev: Date.now() }));
    return () => {
      ['play', 'pause', 'stop', 'nexttrack', 'previoustrack'].forEach(action => {
        try { navigator.mediaSession.setActionHandler(action, null); } catch {}
      });
    };
  }, [playerState.currentTrack, playerState.playing]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handlePlayerChange(changes) {
    setPlayerState(prev => ({ ...prev, ...changes }));
    if (changes._ytRepeat && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(0);
      ytPlayerRef.current.playVideo();
    }
  }

  function handleLogDone() {
    setRefreshKey(k => k + 1);
    setView('dashboard');
  }

  if (isSetup) return <Setup />;

  return (
    <div className="app">
      <div className="noise-overlay" />
      <audio ref={audioRef} style={{ display: 'none' }} />
      <audio ref={keepaliveRef} src={SILENT_WAV} loop style={{ display: 'none' }} />
      <div style={{ position: 'fixed', width: 1, height: 1, overflow: 'hidden', opacity: 0, top: -999, left: -999, pointerEvents: 'none' }}>
        <div ref={ytContainerRef} id="yt-player-container" />
      </div>

      {learnMode && <LearnOS onClose={() => setLearnMode(false)} />}

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
          <button className="gp-play" onClick={e => { e.stopPropagation(); handlePlayerChange({ playing: !playerState.playing }); }}>
            <div className="gp-play-ring" />
            <span className="gp-play-icon">{playerState.playing ? '⏸' : '▶'}</span>
          </button>
        </div>
      )}

      <div className="app-content">
        {view === 'dashboard' && <Dashboard key={refreshKey} onNavigate={setView} />}
        {view === 'log'       && <HabitLog onDone={handleLogDone} onNavigate={setView} />}
        {view === 'stats'     && <Stats onNavigate={setView} />}
        {view === 'coach'     && <AICoach onNavigate={setView} />}
        {view === 'mood'      && <MoodLog onDone={() => setView('dashboard')} onNavigate={setView} />}
        {view === 'journal'   && <Journal onDone={() => setView('dashboard')} onNavigate={setView} />}
        {view === 'focus'     && <FocusTimer onNavigate={setView} />}
        {view === 'goals'     && <Goals onNavigate={setView} />}
        <div style={{ display: view === 'music' ? 'block' : 'none' }}>
          <Music
            playerState={playerState}
            onPlayerChange={handlePlayerChange}
            audioRef={audioRef}
            onNavigate={setView}
          />
        </div>
      </div>

      {/* Navbar always visible — no more hideNav */}
      <NavBar
        active={view}
        onNavigate={setView}
        learnMode={learnMode}
        onLearnToggle={() => setLearnMode(prev => !prev)}
      />
    </div>
  );
}

export default App;
