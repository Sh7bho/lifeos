import React, { useState, useEffect, useRef } from 'react';
import './FlipClock.css';

function FlipDigit({ value }) {
  const [flipping, setFlipping] = useState(false);
  const prevRef = useRef(value);
  const [displayPrev, setDisplayPrev] = useState(value);
  const timerRef = useRef(null);

  useEffect(() => {
    if (value !== prevRef.current) {
      const prev = prevRef.current;
      prevRef.current = value;
      setDisplayPrev(prev);
      setFlipping(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFlipping(true);
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setFlipping(false), 480);
        });
      });
    }
  }, [value]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className="flip-digit">
      <div className="flip-card flip-top-static"><span>{value}</span></div>
      <div className="flip-card flip-bottom-static"><span>{value}</span></div>
      {flipping && (
        <>
          <div className="flip-card flip-top-anim" key={`t${value}${displayPrev}`}>
            <span>{displayPrev}</span>
          </div>
          <div className="flip-card flip-bottom-anim" key={`b${value}`}>
            <span>{value}</span>
          </div>
        </>
      )}
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
      <div className="flipclock-meta">
        <span className="fc-day">STOPWATCH</span>
      </div>
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
      <div className="flipclock-meta">
        <span className="fc-day">TIMER</span>
      </div>
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

export default function FlipClock({ onClose }) {
  const [mode, setMode] = useState('clock');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="flipclock-overlay" onClick={onClose}>
      <div className="flipclock-inner" onClick={e => e.stopPropagation()}>
        {mode === 'clock'     && <ClockFace />}
        {mode === 'stopwatch' && <StopwatchFace />}
        {mode === 'timer'     && <TimerFace />}

        <div className="fc-mode-tabs">
          {['clock','stopwatch','timer'].map(tab => (
            <button
              key={tab}
              className={`fc-tab ${mode === tab ? 'fc-tab--active' : ''}`}
              onClick={() => setMode(tab)}
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
