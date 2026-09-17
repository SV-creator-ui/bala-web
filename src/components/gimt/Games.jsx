import DeferredVideo from "@/components/shared/DeferredVideo";

const games = [
  {
    video: "/games/g-cookdup.mp4",
    poster: "/games/g-cookdup-poster.webp",
    tag: "Nuotykis",
  },
  {
    video: "/games/g-party-ship.mp4",
    poster: "/games/g-party-ship-poster.webp",
    tag: "Veiksmas",
  },
  { img: "/games/g-nuotykis-2.webp", tag: "Nuotykis" },
  {
    video: "/games/g-cops-robbers.mp4",
    poster: "/games/g-cops-robbers-poster.webp",
    tag: "Veiksmas",
  },
  {
    video: "/games/g-nuotykis-5.mp4",
    poster: "/games/g-nuotykis-5-poster.webp",
    tag: "Nuotykis",
  },
  {
    video: "/games/g-veiksmas-4.mp4",
    poster: "/games/g-veiksmas-4.webp",
    tag: "Nuotykis",
  },
  { img: "/games/g-nuotykis-3.webp", tag: "Nuotykis" },
  {
    video: "/games/g-veiksmas-3.mp4",
    poster: "/games/g-veiksmas-3.webp",
    tag: "Veiksmas",
  },
  {
    video: "/games/g-video.mp4",
    poster: "/games/g-video-poster.webp",
    tag: "Nuotykis",
  },
];

export default function Games() {
  return (
    <section className="games section" id="zaidimai">
      <div className="container">
        <div className="label">VR patirtys</div>
        <h2 className="section-heading">Populiariausi žaidimai</h2>
        <div className="games-grid">
          {games.map((game, i) => (
            <div className="game-card" key={i}>
              {game.video ? (
                <DeferredVideo
                  src={game.video}
                  poster={game.poster}
                  alt={`BALA VR žaidimas – ${game.tag}`}
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
