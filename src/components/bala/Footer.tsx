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
  { href: "/", label: "Kitos pramogos" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink">
      {/* subtilus geltonas atspindys viršuje */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-volt/60 to-transparent" />
      <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-volt/[.06] blur-3xl" />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14 pt-16 md:pt-20 pb-8">
        {/* Stulpeliai */}
        <div className="grid gap-10 pb-14 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-smoke-2">Puslapis</h4>
            <div className="flex flex-col gap-0.5">
              {PAGE_LINKS.map((l) => (
                <a key={l.href} href={l.href} className="py-1 text-[14.5px] text-smoke transition-colors hover:text-white">
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-smoke-2">Adresas</h4>
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
              className="group mt-3.5 flex gap-3 text-[14.5px] leading-[1.55] text-smoke transition-colors hover:text-white"
            >
              <PhoneIcon className="mt-0.5 flex-none text-volt" />
              <span>{BUSINESS.phoneDisplay}</span>
            </a>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-smoke-2">Darbo laikas</h4>
            <div className="flex gap-3 text-[14.5px] leading-[1.55] text-smoke">
              <ClockIcon className="mt-0.5 flex-none text-volt" />
              <span>Išankstinė rezervacija</span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em] text-smoke-2">Sekite mus</h4>
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/BalaVRzaidimai/"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-line-strong text-white transition-colors hover:border-volt hover:bg-volt hover:text-volt-ink"
              >
                <FacebookIcon />
              </a>
            </div>
            <a
              href="https://bala.lt/"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-volt transition-opacity hover:opacity-80"
            >
              bala.lt →
            </a>
          </div>
        </div>

        {/* Apatinė juosta */}
        <div className="flex flex-col gap-3 border-t border-line pt-7 text-[13px] text-smoke-2 md:flex-row md:items-center md:justify-between">
          <span>© {year} Bala VR</span>
          <div className="flex items-center gap-5">
            <a href="/taisykles" className="font-semibold text-smoke transition-colors hover:text-white">
              Taisyklės
            </a>
            <a href="/privatumo-politika" className="font-semibold text-smoke transition-colors hover:text-white">
              Privatumo politika
            </a>
          </div>
        </div>
        <p className="mt-4 text-[11px] leading-[1.55] text-smoke-2 max-w-[720px]">{BUSINESS.legalNote}</p>
      </div>
    </footer>
  );
}
