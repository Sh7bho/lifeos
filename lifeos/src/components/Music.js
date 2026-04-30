import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import './Music.css';

// ── Default curated playlists (built-in, not from DB) ──
const CURATED = [
  {
    id: 'focus', label: 'DEEP FOCUS', icon: '🧠', color: '#00D9FF',
    tracks: [
      { id: 'c1', title: 'Lo-Fi Hip Hop Radio', artist: 'Lofi Girl', youtubeId: 'jfKfPfyJRdk', thumb: 'https://img.youtube.com/vi/jfKfPfyJRdk/mqdefault.jpg' },
      { id: 'c2', title: 'Dark Academia Study', artist: 'Aesthetic Vibes', youtubeId: '7NOSDKb0HlU', thumb: 'https://img.youtube.com/vi/7NOSDKb0HlU/mqdefault.jpg' },
      { id: 'c3', title: 'Dark Lo-Fi Beats', artist: 'ChillHop', youtubeId: 'S_MOd40zlYU', thumb: 'https://img.youtube.com/vi/S_MOd40zlYU/mqdefault.jpg' },
    ],
  },
  {
    id: 'gym', label: 'GYM MODE', icon: '💪', color: '#FF6B35',
    tracks: [
      { id: 'c4', title: 'Workout Motivation', artist: 'Various', youtubeId: 'Y8RKTnOqOFs', thumb: 'https://img.youtube.com/vi/Y8RKTnOqOFs/mqdefault.jpg' },
      { id: 'c5', title: 'Hard Trap Beats', artist: 'Trap Nation', youtubeId: 'Q3y-80HBM6Q', thumb: 'https://img.youtube.com/vi/Q3y-80HBM6Q/mqdefault.jpg' },
      { id: 'c6', title: 'Beast Mode Hip Hop', artist: 'Various', youtubeId: 'pMRbplROKEM', thumb: 'https://img.youtube.com/vi/pMRbplROKEM/mqdefault.jpg' },
    ],
  },
  {
    id: 'grind', label: 'LATE NIGHT GRIND', icon: '🌙', color: '#A8FF78',
    tracks: [
      { id: 'c7', title: 'Night Owl Lo-Fi', artist: 'Lofi Girl', youtubeId: 'rUxyKA_-grg', thumb: 'https://img.youtube.com/vi/rUxyKA_-grg/mqdefault.jpg' },
      { id: 'c8', title: 'Midnight Study Beats', artist: 'Various', youtubeId: 'n61ULEU7CO0', thumb: 'https://img.youtube.com/vi/n61ULEU7CO0/mqdefault.jpg' },
      { id: 'c9', title: 'Chill Trap Night', artist: 'Various', youtubeId: 'H-aHaFMVkQU', thumb: 'https://img.youtube.com/vi/H-aHaFMVkQU/mqdefault.jpg' },
    ],
  },
  {
    id: 'boss', label: 'BOSS MINDSET', icon: '📈', color: '#FFD700',
    tracks: [
      { id: 'c10', title: 'Jazz & Coffee', artist: 'Café Music', youtubeId: 'DSGyEsJ17cI', thumb: 'https://img.youtube.com/vi/DSGyEsJ17cI/mqdefault.jpg' },
      { id: 'c11', title: 'Smooth Executive', artist: 'Various', youtubeId: 'lTRiuFIWV54', thumb: 'https://img.youtube.com/vi/lTRiuFIWV54/mqdefault.jpg' },
      { id: 'c12', title: 'Entrepreneur Mix', artist: 'Various', youtubeId: 'ZXsQAXx_ao0', thumb: 'https://img.youtube.com/vi/ZXsQAXx_ao0/mqdefault.jpg' },
    ],
  },
];

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
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

// ── Supabase helpers ──
async function loadMyTracks() {
  try {
    const { data } = await supabase.from('my_tracks').select('*').order('created_at', { ascending: false });
    return data || [];
  } catch { return []; }
}

async function addMyTrack(track) {
  const { data, error } = await supabase.from('my_tracks').insert(track).select().single();
  if (error) throw error;
  return data;
}

async function deleteMyTrack(id) {
  await supabase.from('my_tracks').delete().eq('id', id);
}

async function getSavedState() {
  try {
    const { data } = await supabase.from('music_state').select('*').eq('id', 1).single();
    return data;
  } catch { return null; }
}

async function saveState(state) {
  try {
    await supabase.from('music_state').upsert({ id: 1, ...state, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  } catch {}
}

// ── Equalizer animation ──
function EqBars({ color }) {
  return (
    <div className="eq-bars">
      {[1,2,3,4].map(i => (
        <div key={i} className="eq-bar" style={{ '--c': color, animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  );
}

// ── Add Track Modal ──
function AddTrackModal({ onAdd, onClose }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState('');

  async function handleFetch() {
    const id = extractYouTubeId(url.trim());
    if (!id) { setError('Paste a valid YouTube link or video ID'); return; }
    setLoading(true); setError('');
    const info = await fetchYouTubeTitle(id);
    if (info) { setTitle(info.title); setArtist(info.artist); setFetched(true); }
    else { setTitle(''); setFetched(false); setError('Could not fetch title. Fill it in manually.'); }
    setLoading(false);
  }

  async function handleSave() {
    const id = extractYouTubeId(url.trim());
    if (!id || !title.trim()) { setError('Need a valid link and title'); return; }
    setLoading(true);
    try {
      const track = {
        youtube_id: id,
        title: title.trim(),
        artist: artist.trim() || 'Unknown',
        thumb: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
        created_at: new Date().toISOString(),
      };
      const saved = await addMyTrack(track);
      onAdd({ ...track, id: saved.id });
      onClose();
    } catch { setError('Failed to save. Check Supabase.'); }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">ADD TRACK</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label className="modal-label">YOUTUBE LINK</label>
          <div className="modal-input-row">
            <input
              className="modal-input"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={e => { setUrl(e.target.value); setFetched(false); setError(''); }}
            />
            <button className="modal-fetch-btn" onClick={handleFetch} disabled={loading || !url.trim()}>
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'FETCH'}
            </button>
          </div>
          {error && <div className="modal-error">{error}</div>}

          <label className="modal-label" style={{ marginTop: 14 }}>TITLE</label>
          <input
            className="modal-input"
            placeholder="Track name"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <label className="modal-label" style={{ marginTop: 14 }}>ARTIST</label>
          <input
            className="modal-input"
            placeholder="Artist / channel"
            value={artist}
            onChange={e => setArtist(e.target.value)}
          />

          {fetched && extractYouTubeId(url) && (
            <div className="modal-preview">
              <img src={`https://img.youtube.com/vi/${extractYouTubeId(url)}/mqdefault.jpg`} alt="thumb" className="modal-thumb" />
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
          disabled={loading || !url.trim() || !title.trim()}
        >
          {loading ? 'SAVING...' : 'ADD TO LIBRARY →'}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function Music({ playerState, onPlayerChange }) {
  const [tab, setTab] = useState('my'); // 'my' | playlist id
  const [myTracks, setMyTracks] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(true);

  // Player state lives in App so it persists across view changes
  const { currentTrack, playing } = playerState;

  useEffect(() => {
    loadMyTracks().then(t => { setMyTracks(t); setLoadingTracks(false); });
    getSavedState().then(s => {
      if (s?.youtube_id && !currentTrack) {
        // restore last played
        onPlayerChange({ currentTrack: { youtubeId: s.youtube_id, title: s.title, artist: s.artist, thumb: s.thumb, color: s.color || '#00D9FF' }, playing: false });
      }
    });
  }, []);

  function playTrack(track, color = '#00D9FF') {
    const t = { ...track, youtubeId: track.youtubeId || track.youtube_id, color };
    onPlayerChange({ currentTrack: t, playing: true });
    saveState({ youtube_id: t.youtubeId, title: t.title, artist: t.artist, thumb: t.thumb, color });
  }

  function togglePlay() {
    onPlayerChange({ currentTrack, playing: !playing });
  }

  function handleDelete(id) {
    deleteMyTrack(id);
    setMyTracks(prev => prev.filter(t => t.id !== id));
    if (currentTrack?.id === id) onPlayerChange({ currentTrack: null, playing: false });
  }

  // All tracks for current tab
  const curatedPlaylist = CURATED.find(p => p.id === tab);
  const displayTracks = tab === 'my' ? myTracks : curatedPlaylist?.tracks || [];
  const tabColor = tab === 'my' ? '#FF78C4' : curatedPlaylist?.color || '#00D9FF';

  return (
    <div className="music-page">
      {/* Header */}
      <div className="music-header animate-fadeup">
        <div className="music-header-top">
          <div>
            <div className="page-title">SOUND</div>
            <div className="page-subtitle">Your frequency. Your library.</div>
          </div>
          <button className="add-track-btn" onClick={() => setShowAdd(true)}>
            <span>＋</span> ADD
          </button>
        </div>

        {/* Tab bar */}
        <div className="music-tabs">
          <button className={`music-tab ${tab === 'my' ? 'music-tab--active' : ''}`}
            onClick={() => setTab('my')} style={{ '--tc': '#FF78C4' }}>
            ♥ MY LIBRARY
          </button>
          {CURATED.map(p => (
            <button key={p.id}
              className={`music-tab ${tab === p.id ? 'music-tab--active' : ''}`}
              onClick={() => setTab(p.id)}
              style={{ '--tc': p.color }}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Now Playing Bar */}
      {currentTrack && (
        <div className="now-playing-bar animate-fadeup" style={{ '--np-color': currentTrack.color }}>
          <img src={currentTrack.thumb} alt="" className="np-thumb" />
          <div className="np-info">
            <div className="np-title">{currentTrack.title}</div>
            <div className="np-artist">{currentTrack.artist}</div>
          </div>
          {playing && <EqBars color={currentTrack.color} />}
          <button className="np-play-btn" onClick={togglePlay}
            style={{ background: currentTrack.color, color: '#000' }}>
            {playing ? '⏸' : '▶'}
          </button>
          {playing && (
            <div className="yt-hidden">
              <iframe
                key={currentTrack.youtubeId}
                src={`https://www.youtube.com/embed/${currentTrack.youtubeId}?autoplay=1&controls=0&modestbranding=1`}
                allow="autoplay"
                title="player"
              />
            </div>
          )}
        </div>
      )}

      {/* Track list */}
      <div className="track-list-section animate-fadeup-1">
        {tab === 'my' && !loadingTracks && myTracks.length === 0 && (
          <div className="empty-library">
            <div className="empty-icon">♪</div>
            <div className="empty-title">YOUR LIBRARY IS EMPTY</div>
            <div className="empty-sub">Tap + ADD to drop your first track</div>
            <button className="add-track-btn add-track-btn--big" onClick={() => setShowAdd(true)}>
              ＋ ADD YOUR FIRST TRACK
            </button>
          </div>
        )}

        {loadingTracks && tab === 'my' && (
          <div className="music-loading"><div className="spinner" /></div>
        )}

        {displayTracks.map((track, i) => {
          const isActive = currentTrack?.youtubeId === (track.youtubeId || track.youtube_id);
          return (
            <div
              key={track.id || i}
              className={`track-row ${isActive ? 'track-row--active' : ''}`}
              style={{ '--tr-color': tabColor }}
            >
              <div className="track-row-thumb-wrap" onClick={() => playTrack(track, tabColor)}>
                <img
                  src={track.thumb || `https://img.youtube.com/vi/${track.youtubeId || track.youtube_id}/mqdefault.jpg`}
                  alt=""
                  className="track-row-thumb"
                />
                <div className="track-row-play-overlay">
                  {isActive && playing ? <EqBars color={tabColor} /> : <span className="track-row-play-icon">▶</span>}
                </div>
              </div>
              <div className="track-row-info" onClick={() => playTrack(track, tabColor)}>
                <div className="track-row-title">{track.title}</div>
                <div className="track-row-artist">{track.artist}</div>
              </div>
              <div className="track-row-actions">
                {isActive && playing && <div className="track-row-active-dot" style={{ background: tabColor }} />}
                {tab === 'my' && (
                  <button className="track-delete-btn" onClick={() => handleDelete(track.id)}>✕</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <AddTrackModal
          onAdd={t => setMyTracks(prev => [t, ...prev])}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
