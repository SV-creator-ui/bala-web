export default function HeroVideo({ src = "/hero-vr.mp4" }) {
  return (
    <div className="hero-video-phone">
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <div className="hero-video-badge">
        <span className="hero-video-badge-dot"></span>
        Gimtadienis BALA VR
      </div>
    </div>
  );
}
