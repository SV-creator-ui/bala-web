import Image from "next/image";
import Link from "next/link";
import { FacebookIcon, LocationIcon, ClockIcon, PhoneIcon } from "./icons";
import { BUSINESS } from "@/lib/bala-data";

const PAGE_LINKS = [
  { href: "/pabegimo-kambariai/kambariai", label: "Visi kambariai" },
  { href: "/pabegimo-kambariai#scenarijai", label: "Scenarijai" },
  { href: "/pabegimo-kambariai#kaip-vyksta", label: "Kaip vyksta" },
  { href: "/pabegimo-kambariai#kainos", label: "Kainos" },
  { href: "/pabegimo-kambariai#atsiliepimai", label: "Atsiliepimai" },
  { href: "/pabegimo-kambariai#duk", label: "D.U.K." },
  { href: "/pabegimo-kambariai/blog", label: "Blogas" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink">
      {/* subtilus geltonas atspindys viršuje */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-volt/60 to-transparent" />
      <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-volt/[.06] blur-3xl" />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14 pt-16 pb-8">
        {/* CTA eilutė */}
        <div className="flex flex-col gap-8 border-b border-line pb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-[520px]">
            <Link href="/pabegimo-kambariai" aria-label="Bala VR — pradžia" className="inline-flex flex-col items-center mb-5">
              <Image src="/assets/logo-bala-vr-wordmark.png" alt="Bala VR" width={220} height={40} className="h-[20px] w-auto" />
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] leading-none text-white">
                Virtualios realybės erdvė
              </span>
            </Link>
            <h3 className="font-display uppercase text-white leading-[1.12] text-[clamp(22px,3.4vw,34px)]">
              Pasiruošę <span className="text-volt">pabėgti?</span>
            </h3>
            <p className="mt-3 text-[15px] leading-[1.6] text-smoke">
              9 VR pabėgimo kambariai Klaipėdoje. Išsirinkite scenarijų ir rezervuokite komandai patogų laiką.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="/rezervacija"
              className="inline-flex items-center justify-center rounded-full bg-volt px-7 py-4 text-[15px] font-bold text-volt-ink transition-transform hover:-translate-y-0.5 hover:bg-volt-deep"
            >
              Rezervuoti dabar
            </a>
            <a
              href="/pabegimo-kambariai#kontaktai"
              className="inline-flex items-center justify-center rounded-full border border-line-strong px-7 py-4 text-[15px] font-bold text-white transition-colors hover:border-volt hover:text-volt"
            >
              Kontaktai
            </a>
          </div>
        </div>

        {/* Stulpeliai */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-smoke-2">Puslapis</h4>
            {PAGE_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="block py-1.5 text-[14.5px] text-smoke transition-colors hover:text-white">
                {l.label}
              </a>
            ))}
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-smoke-2">Adresas</h4>
            <a
              href="https://maps.google.com/maps?q=Paj%C5%ABrio%20g.%205B,%20Klaip%C4%97da"
              target="_blank"
              rel="noreferrer"
              className="group flex gap-3 text-[14.5px] leading-[1.55] text-smoke transition-colors hover:text-white"
            >
              <LocationIcon className="mt-0.5 flex-none text-volt" />
              <span>
                Pajūrio g. 5B, Klaipėda
                <br />
                Prekybos centro 2 aukštas
              </span>
            </a>
            <a
              href={BUSINESS.phoneHref}
              aria-label={`Skambinti Bala VR telefonu ${BUSINESS.phoneDisplay}`}
              className="group mt-3 flex gap-3 text-[14.5px] leading-[1.55] text-smoke transition-colors hover:text-white"
            >
              <PhoneIcon className="mt-0.5 flex-none text-volt" />
              <span>{BUSINESS.phoneDisplay}</span>
            </a>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-smoke-2">Darbo laikas</h4>
            <div className="flex gap-3 text-[14.5px] leading-[1.55] text-smoke">
              <ClockIcon className="mt-0.5 flex-none text-volt" />
              <span>Išankstinė rezervacija</span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wide text-smoke-2">Sekite mus</h4>
            <a
              href="https://www.facebook.com/BalaVRzaidimai/"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-line-strong text-white transition-colors hover:border-volt hover:bg-volt hover:text-volt-ink"
            >
              <FacebookIcon />
            </a>
            <a
              href="https://bala.lt/"
              target="_blank"
              rel="noreferrer"
              className="mt-4 block text-[14.5px] font-semibold text-volt transition-opacity hover:opacity-80"
            >
              bala.lt
            </a>
          </div>
        </div>

        {/* Apatinė juosta */}
        <div className="flex flex-col gap-3 border-t border-line pt-7 text-[13px] text-smoke-2 md:flex-row md:items-center md:justify-between">
          <span>© {year} Bala VR · Pajūrio g. 5B, Klaipėda</span>
          <div className="flex items-center gap-4">
            <a href="/taisykles" className="font-semibold text-smoke transition-colors hover:text-white">
              Taisyklės
            </a>
            <span>Sukurta su meile virtualiai realybei.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
