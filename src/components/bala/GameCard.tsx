import Image from "next/image";
import Link from "next/link";
import type { Game } from "@/lib/bala-data";
import { DIFFICULTY_LABEL } from "@/lib/bala-data";

const GENRE_DOT: Record<Game["genreColor"], string> = {
  green: "bg-genre-green",
  blue: "bg-genre-blue",
  pink: "bg-genre-pink",
  orange: "bg-genre-orange",
};

function Dots({ count, colorClass }: { count: number; colorClass: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`w-[7px] h-[7px] rounded-full ${i < count ? colorClass : "bg-white/16"}`}
        />
      ))}
    </div>
  );
}

export default function GameCard({ game, priority = false }: { game: Game; priority?: boolean }) {
  return (
    <article className="rounded-[18px] border-2 border-volt bg-ink-card p-3 flex flex-col transition-transform hover:-translate-y-1 hover:shadow-[0_26px_48px_-22px_rgba(0,0,0,.75)]">
      <Link href={`/pabegimo-kambariai/kambariai/${game.slug}`} className="group relative rounded-[10px] overflow-hidden bg-ink-soft aspect-2/3 block">
        <Image
          src={game.poster}
          alt={`${game.title} — VR pabėgimo kambario plakatas Klaipėdoje`}
          fill
          sizes="(min-width: 980px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized
          priority={priority}
          loading={priority ? "eager" : "lazy"}
        />
        <span className="absolute top-2.5 left-2.5 z-2 inline-flex items-center gap-1.5 rounded-full bg-black/72 backdrop-blur-[3px] py-1.5 pl-2.5 pr-3 text-[10.5px] font-extrabold uppercase tracking-wide text-white">
          <span className={`w-[7px] h-[7px] rounded-full ${GENRE_DOT[game.genreColor]}`} />
          {game.genre}
        </span>
      </Link>
      <div className="flex flex-col flex-1 pt-4 px-1.5 pb-1.5">
        <h3 className="font-display text-[19px] uppercase leading-[1.5] mb-2">
          <Link href={`/pabegimo-kambariai/kambariai/${game.slug}`} className="text-white hover:text-volt transition-colors">
            {game.title}
          </Link>
        </h3>
        <p className="text-sm font-bold text-volt leading-[1.4] mb-2">{game.tagline}</p>
        <p className="text-[13.5px] leading-[1.55] text-smoke flex-1">{game.desc}</p>
        <div className="flex items-end justify-between gap-4 py-[18px]">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-smoke-2 font-bold">Galvosūkiai</span>
            <Dots count={game.difficulty} colorClass="bg-volt" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wide text-smoke-2 font-bold">Veiksmas</span>
            <Dots count={game.action} colorClass="bg-genre-orange" />
          </div>
        </div>
        <Link
          href={`/pabegimo-kambariai/kambariai/${game.slug}`}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-volt text-volt-ink font-bold text-[15px] py-4 transition-[background,transform] hover:bg-volt-deep hover:-translate-y-0.5"
        >
          Sužinoti daugiau
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
    </article>
  );
}

export { DIFFICULTY_LABEL };
