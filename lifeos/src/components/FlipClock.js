import React, { useState, useEffect, useRef } from 'react';
import './FlipClock.css';

// ── FlipDigit — always-mounted cards, CSS class driven, no remount jank ──
function FlipDigit({ value }) {
  const prevRef = useRef(value);
  const prevDisplayRef = useRef(value);
  const [state, setState] = useState({ cur: value, prev: value, flipping: false });
  const timerRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (value === prevRef.current) return;
    const prev = prevRef.current;
    prevRef.current = value;
    prevDisplayRef.current = prev;

    // Cancel any in-flight animation
    cancelAnimationFrame(rafRef.current);
    clearTimeout(timerRef.current);

    // First: reset to non-flipping with new prev value
    setState({ cur: value, prev, flipping: false });

    // Then on next paint, trigger the flip class
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setState({ cur: value, prev, flipping: true });
        timerRef.current = setTimeout(() => {
          setState(s => ({ ...s, flipping: false }));
        }, 500);
      });
    });
  }, [value]);

  useEffect(() => () => {
    clearTimeout(timerRef.current);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const { cur, prev, flipping } = state;

  return (
    <div className="flip-digit">
      {/* Static top — always shows current */}
      <div className="flip-card flip-top-static">
        <span>{cur}</span>
      </div>
      {/* Static bottom — always shows current */}
      <div className="flip-card flip-bottom-static">
        <span>{cur}</span>
      </div>
      {/* Animated top — shows prev, folds away. Always mounted, class triggers anim */}
      <div className={`flip-card flip-top-anim ${flipping ? 'flip-top-anim--go' : ''}`}>
        <span>{flipping ? prev : cur}</span>
      </div>
      {/* Animated bottom — shows cur, unfolds in. Always mounted */}
      <div className={`flip-card flip-bottom-anim ${flipping ? 'flip-bottom-anim--go' : ''}`}>
        <span>{cur}</span>
      </div>
    </div>
  );
}

function FlipPair({ value }) {
  const str = String(value).padStart(2, '0');
  return (
    <div className="flip-pair">
      <FlipDigit value={str[0]} />
      <FlipDigit value={str[1]} />
    </div>
  );
}

function Sep() {
  return (
    <div className="flip-sep">
      <span className="sep-dot" />
      <span className="sep-dot" />
    </div>
  );
}

// ── Clock ──
function ClockFace() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateStr = `${String(time.getDate()).padStart(2,'0')}/${months[time.getMonth()]}/${String(time.getFullYear()).slice(2)}`;
  return (
    <>
      <div className="flipclock-meta">
        <span className="fc-date">{dateStr}</span>
        <span className="fc-day">{days[time.getDay()].toUpperCase()}</span>
      </div>
      <div className="flipclock-digits">
        <FlipPair value={time.getHours()} />
        <Sep />
        <FlipPair value={time.getMinutes()} />
        <Sep />
        <FlipPair value={time.getSeconds()} />
      </div>
    </>
  );
}

// ── Stopwatch ──
function StopwatchFace() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef(null);
  const baseRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    const id = setInterval(() => {
      setElapsed(baseRef.current + Date.now() - startRef.current);
    }, 50);
    return () => clearInterval(id);
  }, [running]);

  function toggle() {
    if (running) baseRef.current = elapsed;
    setRunning(r => !r);
  }
  function reset() {
    setRunning(false);
    baseRef.current = 0;
    setElapsed(0);
  }

  const totalSec = Math.floor(elapsed / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const cs = Math.floor((elapsed % 1000) / 10);

  return (
    <>
      <div className="flipclock-meta"><span className="fc-day">STOPWATCH</span></div>
      <div className="flipclock-digits">
        {h > 0 && <><FlipPair value={h} /><Sep /></>}
        <FlipPair value={m} />
        <Sep />
        <FlipPair value={s} />
        <div className="fc-cs-wrap">
          <span className="fc-cs">.{String(cs).padStart(2,'0')}</span>
        </div>
      </div>
      <div className="fc-controls">
        <button className="fc-btn" onClick={toggle}>
          {running ? 'PAUSE' : elapsed > 0 ? 'RESUME' : 'START'}
        </button>
        <button className="fc-btn fc-btn-ghost" onClick={reset}>RESET</button>
      </div>
    </>
  );
}

// ── Timer ──
function TimerFace() {
  const [setting, setSetting] = useState(true);
  const [inputMin, setInputMin] = useState(5);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  function startTimer() {
    setRemaining(inputMin * 60);
    setDone(false);
    setSetting(false);
    setRunning(true);
  }

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function toggle() { if (!done) setRunning(r => !r); }
  function reset() {
    clearInterval(intervalRef.current);
    setRunning(false); setDone(false); setSetting(true); setRemaining(0);
  }

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  if (setting) return (
    <>
      <div className="flipclock-meta"><span className="fc-day">TIMER</span></div>
      <div className="fc-setup">
        <div className="fc-setup-row">
          <button className="fc-adj" onClick={() => setInputMin(v => Math.max(1, v - 5))}>−5</button>
          <button className="fc-adj" onClick={() => setInputMin(v => Math.max(1, v - 1))}>−1</button>
          <div className="fc-setup-display">
            <span className="fc-setup-num">{String(inputMin).padStart(2,'0')}</span>
            <span className="fc-setup-unit">min</span>
          </div>
          <button className="fc-adj" onClick={() => setInputMin(v => Math.min(180, v + 1))}>+1</button>
          <button className="fc-adj" onClick={() => setInputMin(v => Math.min(180, v + 5))}>+5</button>
        </div>
        <button className="fc-btn" onClick={startTimer}>START TIMER</button>
      </div>
    </>
  );

  return (
    <>
      <div className="flipclock-meta">
        <span className="fc-day">{done ? '✓  DONE' : 'TIMER'}</span>
      </div>
      <div className={`flipclock-digits ${done ? 'fc-done' : ''}`}>
        {h > 0 && <><FlipPair value={h} /><Sep /></>}
        <FlipPair value={m} />
        <Sep />
        <FlipPair value={s} />
      </div>
      <div className="fc-controls">
        {!done && <button className="fc-btn" onClick={toggle}>{running ? 'PAUSE' : 'RESUME'}</button>}
        <button className="fc-btn fc-btn-ghost" onClick={reset}>RESET</button>
      </div>
    </>
  );
}

// ── Main ──
export default function FlipClock({ onClose }) {
  const [mode, setMode] = useState('clock');
  const overlayRef = useRef(null);

  useEffect(() => {
    // Request fullscreen — hides browser UI on mobile
    const el = overlayRef.current || document.documentElement;
    const requestFS =
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.mozRequestFullScreen ||
      el.msRequestFullscreen;

    if (requestFS) {
      requestFS.call(el).catch(() => {}); // silently fail if not allowed
    }

    // Lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Exit fullscreen on close
    return () => {
      document.body.style.overflow = prev;
      const exitFS =
        document.exitFullscreen ||
        document.webkitExitFullscreen ||
        document.mozCancelFullScreen ||
        document.msExitFullscreen;
      if (exitFS && document.fullscreenElement) {
        exitFS.call(document).catch(() => {});
      }
    };
  }, []);

  // Also close if user manually exits fullscreen (e.g. swipe up on iOS)
  useEffect(() => {
    const onFSChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        // Don't auto-close, just let them stay — they can tap outside
      }
    };
    document.addEventListener('fullscreenchange', onFSChange);
    document.addEventListener('webkitfullscreenchange', onFSChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFSChange);
      document.removeEventListener('webkitfullscreenchange', onFSChange);
    };
  }, []);

  return (
    <div className="flipclock-overlay" ref={overlayRef} onClick={onClose}>
      <div className="flipclock-inner" onClick={e => e.stopPropagation()}>
        {mode === 'clock'     && <ClockFace />}
        {mode === 'stopwatch' && <StopwatchFace />}
        {mode === 'timer'     && <TimerFace />}

        <div className="fc-mode-tabs">
          {['clock','stopwatch','timer'].map(tab => (
            <button
              key={tab}
              className={`fc-tab ${mode === tab ? 'fc-tab--active' : ''}`}
              onClick={e => { e.stopPropagation(); setMode(tab); }}
            >
              {tab === 'clock' ? 'CLOCK' : tab === 'stopwatch' ? 'STOPWATCH' : 'TIMER'}
            </button>
          ))}
        </div>

        <div className="flipclock-hint">
          <span className="fc-hint">tap outside to close</span>
        </div>
      </div>
    </div>
  );
}
