"use client";

import { useRef, useState } from "react";

function SpeakerMuted() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function SpeakerOn() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

export default function HeroVideo({ src = "/hero-vr.mp4", sound = false }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    if (!next) {
      // Įjungiant garsą – užtikriname, kad video groja
      v.play?.().catch(() => {});
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
      {sound && (
        <button
          type="button"
          className="hero-video-sound-btn"
          aria-pressed={!muted}
          aria-label={muted ? "Įjungti garsą" : "Išjungti garsą"}
          onClick={toggleSound}
        >
          {muted ? <SpeakerMuted /> : <SpeakerOn />}
        </button>
      )}
      <div className="hero-video-badge">
        <span className="hero-video-badge-dot"></span>
        Gimtadienis BALA VR
      </div>
    </div>
  );
}
