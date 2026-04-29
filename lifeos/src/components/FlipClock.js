import React, { useState, useEffect, useRef } from 'react';
import './FlipClock.css';

function FlipDigit({ value }) {
  const [flipping, setFlipping] = useState(false);
  const prevRef = useRef(value);
  const [displayPrev, setDisplayPrev] = useState(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setDisplayPrev(prevRef.current);
      setFlipping(true);
      const t = setTimeout(() => {
        setFlipping(false);
        prevRef.current = value;
      }, 500);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="flip-digit">
      {/* Static: top half shows current value */}
      <div className="flip-card flip-top-static">
        <span>{value}</span>
      </div>
      {/* Static: bottom half shows current value */}
      <div className="flip-card flip-bottom-static">
        <span>{value}</span>
      </div>

      {/* Animated flap: top (shows prev, folds away) */}
      {flipping && (
        <div className="flip-card flip-top-anim" key={`top-${value}`}>
          <span>{displayPrev}</span>
        </div>
      )}
      {/* Animated flap: bottom (shows new, unfolds in) */}
      {flipping && (
        <div className="flip-card flip-bottom-anim" key={`bot-${value}`}>
          <span>{value}</span>
        </div>
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
    <div
      className={`flipclock-overlay ${isLandscape ? 'landscape' : 'portrait'}`}
      onClick={onClose}
    >
      <div className="flipclock-inner" onClick={e => e.stopPropagation()}>

        <div className="flipclock-meta">
          <span className="fc-date">{dateStr}</span>
          <span className="fc-day">{dayName.toUpperCase()}</span>
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

        <div className="flipclock-hint">
          <span className="fc-hint">tap outside to close</span>
        </div>
      </div>
    </div>
  );
}
