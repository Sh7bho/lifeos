import React, { useState, useEffect, useRef } from 'react'; // useRef still needed for fileRef in AddTrackModal
import { supabase } from '../lib/supabase';
import './Music.css';

const BUCKET = 'audio-tracks';

const CURATED = [
  { id: 'focus', label: 'DEEP FOCUS',       icon: '🧠', color: '#C8A96E' },
  { id: 'gym',   label: 'GYM MODE',         icon: '💪', color: '#E8624A' },
  { id: 'grind', label: 'LATE NIGHT GRIND', icon: '🌙', color: '#7B9CFF' },
  { id: 'boss',  label: 'BOSS MINDSET',     icon: '📈', color: '#C8A96E' },
];



function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

async function fetchYouTubeTitle(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (!res.ok) return null;
    const data = await res.json();
    return { title: data.title, artist: data.author_name };
  } catch { return null; }
}

async function loadTracks(playlist) {
  try {
    const { data } = await supabase.from('my_tracks').select('*').eq('playlist', playlist).order('created_at', { ascending: false });
    return data || [];
  } catch { return []; }
}

async function addTrack(track) {
  const { data, error } = await supabase.from('my_tracks').insert(track).select().single();
  if (error) throw error;
  return data;
}

async function deleteTrack(id, audioUrl) {
  if (audioUrl) {
    const path = audioUrl.split(`/${BUCKET}/`)[1];
    if (path) await supabase.storage.from(BUCKET).remove([path]);
  }
  await supabase.from('my_tracks').delete().eq('id', id);
}

async function uploadAudio(file) {
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ── Equalizer ──
function EqBars({ color }) {
  return (
    <div className="eq-bars">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="eq-bar" style={{ '--c': color, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

// ── Add Track Modal ──
function AddTrackModal({ targetPlaylist, onAdd, onClose }) {
  const [mode, setMode] = useState('youtube');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef();

  const pl = CURATED.find(p => p.id === targetPlaylist) || { label: 'MY LIBRARY', color: '#C8A96E' };

  async function handleFetch() {
    const id = extractYouTubeId(url.trim());
    if (!id) { setError('Paste a valid YouTube link or video ID'); return; }
    setLoading(true); setError('');
    const info = await fetchYouTubeTitle(id);
    if (info) { setTitle(info.title); setArtist(info.artist); setFetched(true); }
    else { setFetched(false); setError('Could not fetch title — fill it in manually.'); }
    setLoading(false);
  }

  async function handleSave() {
    setError('');
    if (mode === 'youtube') {
      const id = extractYouTubeId(url.trim());
      if (!id || !title.trim()) { setError('Need a valid link and title'); return; }
      setLoading(true);
      try {
        const track = {
          youtube_id: id,
          title: title.trim(),
          artist: artist.trim() || 'Unknown',
          thumb: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
          playlist: targetPlaylist,
          created_at: new Date().toISOString(),
        };
        const saved = await addTrack(track);
        onAdd({ ...track, id: saved.id, youtubeId: id });
        onClose();
      } catch { setError('Failed to save. Check Supabase.'); }
      setLoading(false);
    } else {
      if (!file || !title.trim()) { setError('Choose a file and enter a title'); return; }
      setLoading(true);
      try {
        setUploadProgress(10);
        const audioUrl = await uploadAudio(file);
        setUploadProgress(80);
        const track = {
          title: title.trim(),
          artist: artist.trim() || 'Unknown',
          thumb: null,
          audio_url: audioUrl,
          playlist: targetPlaylist,
          created_at: new Date().toISOString(),
        };
        const saved = await addTrack(track);
        setUploadProgress(100);
        onAdd({ ...track, id: saved.id });
        onClose();
      } catch (e) { setError('Upload failed: ' + e.message); }
      setLoading(false);
    }
  }

  const ytId = mode === 'youtube' ? extractYouTubeId(url) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-drag-pill" />
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-title">ADD TRACK</span>
            <span className="modal-playlist-badge" style={{ '--pc': pl.color }}>{pl.label}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-mode-toggle">
          <button className={`mode-btn ${mode === 'youtube' ? 'mode-btn--active' : ''}`} onClick={() => setMode('youtube')}>
            <span className="mode-btn-icon">▶</span> YouTube
          </button>
          <button className={`mode-btn ${mode === 'file' ? 'mode-btn--active' : ''}`} onClick={() => setMode('file')}>
            <span className="mode-btn-icon">↑</span> Upload
          </button>
        </div>

        <div className="modal-body">
          {mode === 'youtube' ? (
            <>
              <label className="modal-label">YOUTUBE LINK</label>
              <div className="modal-input-row">
                <input
                  className="modal-input"
                  placeholder="https://youtube.com/watch?v=..."
                  value={url}
                  onChange={e => { setUrl(e.target.value); setFetched(false); setError(''); }}
                />
                <button className="modal-fetch-btn" onClick={handleFetch} disabled={loading || !url.trim()}>
                  {loading ? <span className="spinner-sm" /> : 'FETCH'}
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="modal-label">AUDIO FILE</label>
              <div
                className={`file-drop-zone ${file ? 'file-drop-zone--has-file' : ''}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); } }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files[0]; if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, '')); } }}
                />
                {file ? (
                  <div className="file-info">
                    <div className="file-icon-wrap">♪</div>
                    <div>
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                    </div>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <div className="file-upload-icon">↑</div>
                    <div className="file-upload-label">Tap to choose or drag & drop</div>
                    <div className="file-upload-hint">MP3 · WAV · M4A · OGG</div>
                  </div>
                )}
              </div>
              {loading && uploadProgress > 0 && (
                <div className="upload-progress-bar">
                  <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </>
          )}

          {error && <div className="modal-error">{error}</div>}

          <label className="modal-label" style={{ marginTop: 16 }}>TITLE</label>
          <input className="modal-input" placeholder="Track name" value={title} onChange={e => setTitle(e.target.value)} />

          <label className="modal-label" style={{ marginTop: 14 }}>ARTIST</label>
          <input className="modal-input" placeholder="Artist / channel" value={artist} onChange={e => setArtist(e.target.value)} />

          {fetched && ytId && (
            <div className="modal-preview">
              <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="thumb" className="modal-thumb" />
              <div>
                <div className="modal-preview-title">{title}</div>
                <div className="modal-preview-artist">{artist}</div>
              </div>
            </div>
          )}
        </div>

        <button
          className="modal-save-btn"
          onClick={handleSave}
          disabled={loading || !title.trim() || (mode === 'youtube' ? !url.trim() : !file)}
          style={{ '--sb-color': pl.color }}
        >
          {loading ? (mode === 'file' ? `UPLOADING ${uploadProgress}%` : 'SAVING...') : 'ADD TO LIBRARY'}
          {!loading && <span className="modal-save-arrow">→</span>}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ──
// audioRef comes from App.js where the <audio> element permanently lives
export default function Music({ playerState, onPlayerChange, audioRef }) {
  const [tab, setTab] = useState('my');
  const [tracks, setTracks] = useState({});
  const [loadingTab, setLoadingTab] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { currentTrack, playing } = playerState;
  const isAudioTrack = !!currentTrack?.audio_url;

  const [volume, setVolume] = useState(Number(localStorage.getItem('musicVolume')) || 80);
  const [playMode, setPlayMode] = useState('queue');
  const [queue, setQueue] = useState([]);
  const [showQueue, setShowQueue] = useState(false);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Persist volume
  useEffect(() => { localStorage.setItem('musicVolume', volume); }, [volume]);

  // Wire up the audio element's time/duration events (the element lives in App.js)
  useEffect(() => {
    const el = audioRef?.current;
    if (!el) return;
    const onTimeUpdate = () => { if (el.duration) setProgress((el.currentTime / el.duration) * 100); };
    const onMeta       = () => setDuration(el.duration);
    const onEnded      = () => {
      setProgress(0);
      if (playMode === 'repeat') {
        el.currentTime = 0;
        el.play().catch(() => {});
        return;
      }
      const next = getNextTrack(1);
      if (next) playTrack(next, getTabColor(tab));
      else onPlayerChange({ currentTrack: null, playing: false });
    };
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('ended', onEnded);
    };
  // Re-attach when playMode or tab changes so onEnded closure is fresh
  }, [audioRef, playMode, tab, queue]);

  function handleSeek(val) {
    setProgress(val);
    if (audioRef.current && duration) {
      audioRef.current.currentTime = (val / 100) * duration;
    }
    onPlayerChange({ currentTrack, playing, volume, seekPct: val });
  }

  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Build queue from tab
  useEffect(() => {
    const list = getAllTracksForTab(tab);
    setQueue(list.map((t, i) => ({ ...t, _qi: i })));
  }, [tab, tracks]);

  function cyclePlayMode() {
    setPlayMode(m => m === 'queue' ? 'shuffle' : m === 'shuffle' ? 'repeat' : 'queue');
  }
  function playModeIcon() {
    if (playMode === 'shuffle') return '⇄';
    if (playMode === 'repeat')  return '↻';
    return '≡';
  }
  function playModeLabel() {
    if (playMode === 'shuffle') return 'SHUFFLE';
    if (playMode === 'repeat')  return 'REPEAT';
    return 'QUEUE';
  }

  function getNextTrack(dir = 1) {
    const list = queue.length ? queue : getAllTracksForTab(tab);
    if (!list.length) return null;
    if (playMode === 'repeat') return currentTrack;
    if (playMode === 'shuffle') {
      const others = list.filter(t => {
        const ytId = t.youtubeId || t.youtube_id;
        return !(currentTrack && ((ytId && currentTrack.youtubeId === ytId) || (t.audio_url && currentTrack.audio_url === t.audio_url)));
      });
      return others.length ? others[Math.floor(Math.random() * others.length)] : list[0];
    }
    const idx = list.findIndex(t => {
      const ytId = t.youtubeId || t.youtube_id;
      return currentTrack && ((ytId && currentTrack.youtubeId === ytId) || (t.audio_url && currentTrack.audio_url === t.audio_url));
    });
    const next = (idx + dir + list.length) % list.length;
    return list[next];
  }

  function skipTrack(dir) {
    const next = getNextTrack(dir);
    if (next) playTrack(next, getTabColor(tab));
  }

  function moveInQueue(from, to) {
    setQueue(prev => {
      const q = [...prev];
      const [item] = q.splice(from, 1);
      q.splice(to, 0, item);
      return q;
    });
  }

  function removeFromQueue(idx) {
    setQueue(prev => prev.filter((_, i) => i !== idx));
  }

  function handleVolumeChange(val) {
    setVolume(val);
    onPlayerChange({ currentTrack, playing, volume: val });
  }

  // Online/offline
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    if (!isOnline && playing && currentTrack && !currentTrack.audio_url) {
      const playlistTracks = getAllTracksForTab(tab);
      const fallback = playlistTracks.find(t => t.audio_url);
      if (fallback) playTrack(fallback, getTabColor(tab));
    }
  }, [isOnline]);

  async function ensureTabLoaded(tabId) {
    if (tracks[tabId] !== undefined || loadingTab[tabId]) return;
    setLoadingTab(prev => ({ ...prev, [tabId]: true }));
    const data = await loadTracks(tabId);
    setTracks(prev => ({ ...prev, [tabId]: data }));
    setLoadingTab(prev => ({ ...prev, [tabId]: false }));
  }

  useEffect(() => { ensureTabLoaded(tab); }, [tab]);

  function getAllTracksForTab(tabId) {
    return tracks[tabId] || [];
  }

  function getTabColor(tabId) {
    if (tabId === 'my') return '#C8A96E';
    return CURATED.find(p => p.id === tabId)?.color || '#C8A96E';
  }

  function playTrack(track, color) {
    const t = { ...track, youtubeId: track.youtubeId || track.youtube_id, color };
    onPlayerChange({ currentTrack: t, playing: true });
  }

  function togglePlay() {
    onPlayerChange({ currentTrack, playing: !playing });
  }

  function handleDelete(track) {
    deleteTrack(track.id, track.audio_url);
    setTracks(prev => ({
      ...prev,
      [tab]: (prev[tab] || []).filter(t => t.id !== track.id),
    }));
    if (currentTrack?.id === track.id) onPlayerChange({ currentTrack: null, playing: false });
  }

  function handleAdd(newTrack) {
    setTracks(prev => ({
      ...prev,
      [newTrack.playlist]: [newTrack, ...(prev[newTrack.playlist] || [])],
    }));
  }

  const displayTracks = getAllTracksForTab(tab);
  const tabColor = getTabColor(tab);
  const isLoading = loadingTab[tab];

  return (
    <div className="music-page">
      <div className="music-bg-orb-1" />
      <div className="music-bg-orb-2" />
      <div className="music-bg-grain" />

      {/* Header */}
      <div className="music-header animate-fadeup">
        <div className="music-header-top">
          <div>
            <div className="page-title">
              SOUND
              {!isOnline && <span className="offline-badge">● OFFLINE</span>}
            </div>
            <div className="page-subtitle">Your frequency. Your library.</div>
          </div>
          <button className="add-track-btn" onClick={() => setShowAdd(true)}>
            <span className="add-btn-plus">＋</span> ADD TRACK
          </button>
        </div>

        <div className="music-tabs">
          <button
            className={`music-tab ${tab === 'my' ? 'music-tab--active' : ''}`}
            onClick={() => setTab('my')}
            style={{ '--tc': '#C8A96E' }}
          >
            ♥ MY LIBRARY
          </button>
          {CURATED.map(p => (
            <button
              key={p.id}
              className={`music-tab ${tab === p.id ? 'music-tab--active' : ''}`}
              onClick={() => setTab(p.id)}
              style={{ '--tc': p.color }}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Now Playing Bar */}
      {currentTrack && (
        <div className="now-playing-bar" style={{ '--np-color': currentTrack.color || '#C8A96E' }}>
          <div className="np-glow-strip" />
          <div className="np-color-wash" />

          {isAudioTrack && (
            <div className="np-seek-row">
              <span className="np-time">{formatTime((progress / 100) * duration)}</span>
              <input
                type="range"
                className="np-seek-slider"
                min="0" max="100"
                value={progress}
                onChange={e => handleSeek(Number(e.target.value))}
                style={{ '--pct': `${progress}%` }}
              />
              <span className="np-time">{formatTime(duration)}</span>
            </div>
          )}

          <div className="np-main-row">
            {currentTrack.thumb ? (
              <img src={currentTrack.thumb} alt="" className="np-thumb" />
            ) : (
              <div className="np-thumb np-thumb--audio">♪</div>
            )}

            <div className="np-info">
              <div className="np-title">{currentTrack.title}</div>
              <div className="np-artist">
                {currentTrack.audio_url ? '↑ ' : '▶ '}{currentTrack.artist}
                {!isOnline && currentTrack.audio_url && <span className="np-offline-tag">offline</span>}
              </div>
            </div>

            {playing && <EqBars color={currentTrack.color || '#C8A96E'} />}

            <div className="np-controls">
              <button className="np-mode-btn" onClick={cyclePlayMode} title={playModeLabel()} style={{ color: playMode !== 'queue' ? (currentTrack.color || '#C8A96E') : undefined }}>
                {playModeIcon()}
              </button>
              <button className="np-skip-btn" onClick={() => skipTrack(-1)} title="Previous">⏮</button>
              <button
                className="np-play-btn"
                onClick={togglePlay}
                style={{ '--btn-color': currentTrack.color || '#C8A96E' }}
              >
                {playing ? '⏸' : '▶'}
              </button>
              <button className="np-skip-btn" onClick={() => skipTrack(1)} title="Next">⏭</button>
              <button className="np-queue-btn" onClick={() => setShowQueue(q => !q)} title="Queue" style={{ color: showQueue ? (currentTrack.color || '#C8A96E') : undefined }}>
                ☰
              </button>
            </div>

            <div className="np-volume-wrap">
              <span className="np-volume-icon">{volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊'}</span>
              <input
                type="range"
                className="np-volume-slider"
                min="0" max="100"
                value={volume}
                onChange={e => handleVolumeChange(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Queue Panel */}
      {showQueue && currentTrack && (
        <div className="queue-panel animate-fadeup">
          <div className="queue-header">
            <span className="queue-title">QUEUE</span>
            <div className="queue-mode-tabs">
              {['queue','shuffle','repeat'].map(m => (
                <button
                  key={m}
                  className={`queue-mode-tab ${playMode === m ? 'queue-mode-tab--active' : ''}`}
                  style={{ '--qc': currentTrack.color || '#C8A96E' }}
                  onClick={() => setPlayMode(m)}
                >
                  {m === 'queue' ? '≡ QUEUE' : m === 'shuffle' ? '⇄ SHUFFLE' : '↻ REPEAT'}
                </button>
              ))}
            </div>
            <button className="queue-close" onClick={() => setShowQueue(false)}>✕</button>
          </div>

          <div className="queue-list">
            {queue.map((t, i) => {
              const ytId = t.youtubeId || t.youtube_id;
              const isActive = currentTrack && (
                (ytId && currentTrack.youtubeId === ytId) ||
                (t.audio_url && currentTrack.audio_url === t.audio_url)
              );
              return (
                <div key={t.id || i} className={`queue-item ${isActive ? 'queue-item--active' : ''}`} style={{ '--qc': currentTrack.color || '#C8A96E' }}>
                  <span className="queue-num">{isActive ? '▶' : i + 1}</span>
                  {t.thumb
                    ? <img src={t.thumb} alt="" className="queue-thumb" />
                    : <div className="queue-thumb queue-thumb--audio">♪</div>
                  }
                  <div className="queue-info" onClick={() => playTrack(t, getTabColor(tab))}>
                    <div className="queue-item-title">{t.title}</div>
                    <div className="queue-item-artist">{t.artist}</div>
                  </div>
                  <div className="queue-item-actions">
                    {i > 0 && <button className="queue-move-btn" onClick={() => moveInQueue(i, i-1)}>↑</button>}
                    {i < queue.length - 1 && <button className="queue-move-btn" onClick={() => moveInQueue(i, i+1)}>↓</button>}
                    {!isActive && <button className="queue-remove-btn" onClick={() => removeFromQueue(i)}>✕</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Track List */}
      <div className="track-list-section animate-fadeup-1">
        {tab === 'my' && !isLoading && displayTracks.length === 0 && (
          <div className="empty-library">
            <div className="empty-icon">♪</div>
            <div className="empty-title">YOUR LIBRARY IS EMPTY</div>
            <div className="empty-sub">Add YouTube links or upload audio files</div>
            <button className="add-track-btn add-track-btn--big" onClick={() => setShowAdd(true)}>
              ＋ ADD YOUR FIRST TRACK
            </button>
          </div>
        )}

        {isLoading && (
          <div className="music-loading">
            <div className="spinner" />
          </div>
        )}

        {displayTracks.map((track, i) => {
          const ytId = track.youtubeId || track.youtube_id;
          const isActive = currentTrack && (
            (ytId && currentTrack.youtubeId === ytId) ||
            (track.audio_url && currentTrack.audio_url === track.audio_url)
          );

          return (
            <div
              key={track.id || i}
              className={`track-row ${isActive ? 'track-row--active' : ''}`}
              style={{ '--tr-color': tabColor, animationDelay: `${i * 0.04}s` }}
            >
              <div className="track-row-num">{isActive && playing ? <EqBars color={tabColor} /> : <span>{i + 1}</span>}</div>

              <div className="track-row-thumb-wrap" onClick={() => playTrack(track, tabColor)}>
                {track.thumb ? (
                  <img src={track.thumb} alt="" className="track-row-thumb" />
                ) : (
                  <div className="track-row-thumb track-row-thumb--audio">♪</div>
                )}
                <div className="track-row-play-overlay">
                  <span className="track-row-play-icon">▶</span>
                </div>
              </div>

              <div className="track-row-info" onClick={() => playTrack(track, tabColor)}>
                <div className="track-row-title">{track.title}</div>
                <div className="track-row-artist">
                  {track.audio_url && <span className="track-local-tag">LOCAL</span>}
                  {track.artist}
                </div>
              </div>

              <div className="track-row-actions">
                {track.id && (
                  <button className="track-delete-btn" onClick={() => handleDelete(track)}>✕</button>
                )}
              </div>
            </div>
          );
        })}

        {tab !== 'my' && !isLoading && (
          <div className="add-to-playlist-cta">
            <button className="add-track-btn add-track-btn--big" style={{ '--bc': tabColor }} onClick={() => setShowAdd(true)}>
              ＋ ADD TO {CURATED.find(p => p.id === tab)?.label}
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <AddTrackModal
          targetPlaylist={tab}
          onAdd={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
