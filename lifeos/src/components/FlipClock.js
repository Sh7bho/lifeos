import React, { useState, useEffect, useRef } from 'react';
import './FlipClock.css';

function FlipDigit({ value, prevValue }) {
  const [flipping, setFlipping] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setFlipping(true);
      const t = setTimeout(() => {
        setFlipping(false);
        prevRef.current = value;
      }, 500);
      return () => clearTimeout(t);
    }
  }, [value]);

  const prev = prevRef.current;

  return (
    <div className={`flip-digit ${flipping ? 'flipping' : ''}`}>
      {/* Static top half showing current */}
      <div className="flip-top">
        <span>{value}</span>
      </div>
      {/* Static bottom half showing current */}
      <div className="flip-bottom">
        <span>{value}</span>
      </div>
      {/* Animated top flap (shows prev, folds down) */}
      {flipping && (
        <div className="flip-top-anim">
          <span>{prev}</span>
        </div>
      )}
      {/* Animated bottom flap (shows new, revealed) */}
      {flipping && (
        <div className="flip-bottom-anim">
          <span>{value}</span>
        </div>
      )}
    </div>
  );
}

function FlipPair({ value }) {
  const d1 = String(value).padStart(2, '0')[0];
  const d2 = String(value).padStart(2, '0')[1];
  return (
    <div className="flip-pair">
      <FlipDigit value={d1} />
      <FlipDigit value={d2} />
    </div>
  );
}

export default function FlipClock({ onClose }) {
  const [time, setTime] = useState(new Date());
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight
  );

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const h = time.getHours();
  const m = time.getMinutes();
  const s = time.getSeconds();

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayName = days[time.getDay()];
  const dateStr = `${String(time.getDate()).padStart(2,'0')}/${months[time.getMonth()]}/${String(time.getFullYear()).slice(2)}`;

  return (
    <div className={`flipclock-overlay ${isLandscape ? 'landscape' : 'portrait'}`} onClick={onClose}>
      <div className="flipclock-inner" onClick={e => e.stopPropagation()}>

        <div className="flipclock-meta top">
          <span className="fc-date">{dateStr}</span>
          <span className="fc-day">{dayName}</span>
        </div>

        <div className="flipclock-digits">
          <FlipPair value={h} />
          <div className="flip-sep">
            <span className="sep-dot" />
            <span className="sep-dot" />
          </div>
          <FlipPair value={m} />
          <div className="flip-sep">
            <span className="sep-dot" />
            <span className="sep-dot" />
          </div>
          <FlipPair value={s} />
        </div>

        <div className="flipclock-meta bottom">
          <span className="fc-hint">tap outside to close</span>
        </div>
      </div>
    </div>
  );
}
