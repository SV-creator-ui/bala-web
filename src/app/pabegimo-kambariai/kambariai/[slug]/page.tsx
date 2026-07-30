import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/bala/Nav";
import Footer from "@/components/bala/Footer";
import GameCard from "@/components/bala/GameCard";
import { CtaBandSection } from "@/components/bala/Sections";
import { GAMES, getGame } from "@/lib/bala-data";

export function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) return { title: "Scenarijus nerastas — Bala VR" };
  return {
    title: `${game.title} — VR pabėgimo kambarys Klaipėdoje | Bala VR`,
    description: `${game.tagline} ${game.desc}`,
  };
}

function Dots({ count, colorClass }: { count: number; colorClass: string }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`w-2 h-2 rounded-full ${i < count ? colorClass : "bg-white/16"}`} />
      ))}
    </div>
  );
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();

  const others = GAMES.filter((g) => g.slug !== game.slug).slice(0, 3);
  // Sudėtingesni kambariai (4+ galvosūkių taškeliai) trunka ilgiau
  const durationLabel = game.difficulty >= 4 ? "iki 50 min." : game.time;

  return (
    <>
      <Nav />
      <main>
        {/* HERO */}
        <header className="relative pt-[132px] md:pt-[150px] pb-6 overflow-hidden bg-ink">
          <div className="absolute inset-0">
            <Image src={game.poster} alt="" fill className="object-cover object-center opacity-25" priority unoptimized />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
          </div>
          <div className="relative mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14">
            <Link
              href="/pabegimo-kambariai/kambariai"
              className="inline-flex items-center gap-2 text-smoke hover:text-white text-sm font-semibold mb-8 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Visi pabėgimo kambariai
            </Link>
            <h1 className="font-display uppercase text-white leading-[1.05] tracking-[-.01em] text-[clamp(34px,6vw,72px)] mb-4">
              {game.title}
            </h1>
            <p className="text-[clamp(16px,2vw,20px)] leading-[1.5] text-volt font-semibold max-w-[720px] mb-9">
              {game.tagline}
            </p>

            {(() => {
              const poster = (
                <div className="relative w-[220px] md:w-full aspect-2/3 rounded-2xl overflow-hidden border-2 border-volt shadow-[0_24px_60px_-18px_rgba(0,0,0,.7)]">
                  <Image
                    src={game.poster}
                    alt={`${game.title} — VR pabėgimo kambario plakatas Klaipėdoje`}
                    fill
                    sizes="(min-width:768px) 300px, 220px"
                    className="object-cover"
                    priority
                    unoptimized
                  />
                </div>
              );
              if (!game.youtubeId) return poster;
              return (
                <div className="grid gap-6 md:gap-8 md:grid-cols-[300px_1fr] md:items-stretch">
                  {poster}
                  <div className="relative w-full aspect-video md:aspect-auto md:h-full rounded-2xl overflow-hidden border-2 border-volt bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${game.youtubeId}`}
                      title={`${game.title} — vaizdo įrašas`}
                      className="absolute inset-0 w-full h-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                    <a
                      href={`https://www.youtube.com/watch?v=${game.youtubeId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-black/85 transition-colors"
                    >
                      YouTube
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17 17 7M9 7h8v8" />
                      </svg>
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        </header>

        {/* ABOUT + STATS */}
        <section className="pt-6 md:pt-8 pb-16 md:pb-24">
          <div className="mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-volt/40 bg-ink-card p-8 md:p-10">
              <h2 className="font-display uppercase text-white text-[clamp(24px,3vw,36px)] mb-6">Apie scenarijų</h2>
              <div className="flex flex-col gap-4">
                {game.description.map((p) => (
                  <p key={p} className="text-[15.5px] leading-[1.7] text-smoke">
                    {p}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-ink-card p-8 flex flex-col">
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs uppercase tracking-wide text-smoke-2 font-bold">Trukmė</span>
                  <span className="font-display text-lg text-white">{durationLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs uppercase tracking-wide text-smoke-2 font-bold">Galvosūkiai</span>
                  <Dots count={game.difficulty} colorClass="bg-volt" />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs uppercase tracking-wide text-smoke-2 font-bold">Veiksmas</span>
                  <Dots count={game.action} colorClass="bg-genre-orange" />
                </div>
              </div>

              <div className="h-px bg-line my-6" />

              <div className="flex flex-wrap gap-2">
                {game.tags.map((t) => (
                  <span key={t} className="rounded-full bg-ink-soft border border-line text-smoke text-xs font-semibold px-3 py-1.5">
                    {t}
                  </span>
                ))}
              </div>

              <a
                href="https://bala.lt/"
                target="_blank"
                rel="noreferrer"
                className="mt-7 w-full text-center rounded-full bg-volt text-volt-ink font-bold text-[15px] py-4 transition-[background,transform] hover:bg-volt-deep hover:-translate-y-0.5"
              >
                Rezervuoti dabar
              </a>
            </div>
          </div>
        </section>

        {/* MORE GAMES */}
        <section className="py-16 md:py-24 !pt-0">
          <div className="mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14">
            <h2 className="font-display uppercase text-white text-[clamp(24px,4.4vw,52px)] mb-10">Daugiau nuotykių</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
              {others.map((g) => (
                <GameCard key={g.slug} game={g} />
              ))}
            </div>
          </div>
        </section>

        <CtaBandSection />
      </main>
      <Footer />
    </>
  );
}
