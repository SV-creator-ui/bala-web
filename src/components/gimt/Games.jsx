const games = [
  { img: "/games/g-nuotykis-1.webp", tag: "Nuotykis" },
  { img: "/games/g-veiksmas-1.webp", tag: "Veiksmas" },
  { img: "/games/g-nuotykis-2.webp", tag: "Nuotykis" },
  { img: "/games/g-veiksmas-2.webp", tag: "Veiksmas" },
  { img: "/games/g-nuotykis-5.webp", tag: "Nuotykis" },
  { img: "/games/g-veiksmas-4.webp", tag: "Veiksmas" },
  { img: "/games/g-nuotykis-3.webp", tag: "Nuotykis" },
  { img: "/games/g-veiksmas-3.webp", tag: "Veiksmas" },
  { video: "/games/g-video.mp4", tag: "Nuotykis" },
];

export default function Games() {
  return (
    <section className="games section" id="games">
      <div className="container">
        <div className="label">VR patirtys</div>
        <h2 className="section-heading">Populiariausi žaidimai</h2>
        <div className="games-grid">
          {games.map((game, i) => (
            <div className="game-card" key={i}>
              {game.video ? (
                <video
                  src={game.video}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={game.img}
                  alt={`BALA VR žaidimas – ${game.tag}`}
                  loading="lazy"
                />
              )}
              <span className="game-tag game-tag-top">{game.tag}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="games-demon" aria-hidden="true">
        <img src="/demon.webp" alt="" className="games-demon-img" />
      </div>
    </section>
  );
}
