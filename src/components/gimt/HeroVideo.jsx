"use client";

import { useRef, useState } from "react";

export default function HeroVideo({ src = "/hero-vr.mp4", quote = null }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    if (!next) {
      // Užtikrinam, kad grojimas tęstųsi įjungus garsą
      video.play().catch(() => {});
    }
    setMuted(next);
  };

  return (
    <div className="hero-video-phone">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <button
        type="button"
        className="hero-video-sound-btn"
        onClick={toggleSound}
        aria-pressed={!muted}
        aria-label={muted ? "Įjungti garsą" : "Išjungti garsą"}
        title={muted ? "Įjungti garsą" : "Išjungti garsą"}
      >
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>
      {quote && (
        <div className="hero-quote-float">
          <div className="hero-quote-stars" aria-hidden="true">★★★★★</div>
          <p className="hero-quote-text">{quote.text}</p>
          <div className="hero-quote-author">{quote.author}</div>
        </div>
      )}
      <div className="hero-video-badge">
        <span className="hero-video-badge-dot"></span>
        Gimtadienis BALA VR
      </div>
    </div>
  );
}
