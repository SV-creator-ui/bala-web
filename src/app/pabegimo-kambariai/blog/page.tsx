import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/bala/Nav";
import Footer from "@/components/bala/Footer";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { CtaBandSection } from "@/components/bala/Sections";

export const metadata: Metadata = {
  title: "VR blogas — pramogos ir laisvalaikis Klaipėdoje | Bala VR",
  description:
    "Bala VR blogas: idėjos laisvalaikiui Klaipėdoje, VR pabėgimo kambarių patarimai ir pramogos visai komandai, šeimai bei gimtadieniui.",
};

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  category: string;
  readingTime: string;
  /** CSS object-position viršelio kadravimui (pvz. „center 22%“). Numatytoji – centras. */
  coverPosition?: string;
};

const POSTS: Post[] = [
  {
    slug: "kas-yra-vr-pabegimo-kambarys",
    title: "Kas yra VR pabėgimo kambarys?",
    excerpt:
      "Virtualios realybės pabėgimo kambarys – klasikinio pabėgimo kambario idėja be fizinių ribų. Kaip jis veikia ir kodėl taip įtraukia?",
    cover: "/assets/vr-pabegimo-kambarys-bala-vr-klaipedoje.jpg",
    category: "Gidas",
    readingTime: "~5 min skaitymo",
  },
  {
    slug: "5-pramogos-klaipedoje",
    title: "5 pramogos Klaipėdoje, kurias verta išbandyti",
    excerpt:
      "Ką veikti Klaipėdoje? Surinkome penkias pramogas visai komandai — nuo VR pabėgimo kambarių iki boulingo, kartingo ir jūrų muziejaus.",
    cover: "/assets/why-vr.png",
    coverPosition: "center 18%",
    category: "Laisvalaikis",
    readingTime: "~6 min skaitymo",
  },
];

export default function BlogIndex() {
  const [featured, ...rest] = POSTS;

  return (
    <>
      <Nav />
      <main>
        <header className="relative pt-[150px] pb-14 overflow-hidden bg-[radial-gradient(120%_70%_at_100%_0%,rgba(255,228,0,.08),transparent_60%)] bg-ink">
          <div className="mx-auto max-w-[1320px] px-6 md:px-8">
            <Link
              href="/pabegimo-kambariai"
              className="inline-flex items-center gap-2 text-smoke hover:text-white text-sm font-semibold mb-6 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Atgal į pradžią
            </Link>
            <span className="block text-xs font-bold uppercase tracking-[.14em] text-volt mb-3">VR blogas</span>
            <h1 className="font-display uppercase text-white text-[clamp(26px,6vw,72px)] leading-[1.05] tracking-[-.01em]">
              Pramogos ir laisvalaikis Klaipėdoje
            </h1>
            <p className="text-[clamp(16px,2vw,19px)] leading-[1.65] text-smoke max-w-[560px] mt-5">
              Idėjos, patarimai ir įkvėpimas laisvalaikiui — nuo VR pabėgimo kambarių iki kitų pramogų visai komandai, šeimai ir draugams.
            </p>
          </div>
        </header>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-[1320px] px-6 md:px-8">
            {/* Pagrindinis (featured) įrašas */}
            <RevealOnScroll>
              <Link
                href={`/pabegimo-kambariai/blog/${featured.slug}`}
                className="group grid gap-8 md:grid-cols-2 items-center rounded-2xl border border-line bg-ink-soft overflow-hidden transition-colors hover:border-volt/50"
              >
                <div className="relative h-[240px] md:h-[360px] overflow-hidden">
                  <Image
                    src={featured.cover}
                    alt={featured.title}
                    fill
                    style={{ objectPosition: featured.coverPosition ?? "center 25%" }}
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    priority
                  />
                </div>
                <div className="p-7 md:p-10">
                  <div className="flex items-center gap-2 text-xs text-smoke-2">
                    <span className="font-bold uppercase tracking-wide text-volt">{featured.category}</span>
                    <span>·</span>
                    <span>{featured.readingTime}</span>
                  </div>
                  <h2 className="font-display uppercase text-white text-[clamp(24px,3.4vw,40px)] leading-[1.08] mt-4 group-hover:text-volt transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-[16px] leading-[1.7] text-smoke mt-4">{featured.excerpt}</p>
                  <span className="inline-flex items-center gap-2 mt-6 text-sm font-bold uppercase tracking-wide text-volt">
                    Skaityti straipsnį
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </div>
              </Link>
            </RevealOnScroll>

            {/* Likę įrašai */}
            {rest.length > 0 && (
              <RevealOnScroll className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                {rest.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/pabegimo-kambariai/blog/${post.slug}`}
                    className="group flex flex-col rounded-xl border border-line bg-ink-soft overflow-hidden transition-colors hover:border-volt/50"
                  >
                    <div className="relative h-[200px] overflow-hidden">
                      <Image
                        src={post.cover}
                        alt={post.title}
                        fill
                        style={{ objectPosition: post.coverPosition ?? "center" }}
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="flex flex-col flex-1 p-6">
                      <div className="flex items-center gap-2 text-xs text-smoke-2">
                        <span className="font-bold uppercase tracking-wide text-volt">{post.category}</span>
                        <span>·</span>
                        <span>{post.readingTime}</span>
                      </div>
                      <h3 className="font-display uppercase text-white text-xl leading-[1.12] mt-3 group-hover:text-volt transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-[15px] leading-[1.6] text-smoke mt-3">{post.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </RevealOnScroll>
            )}
          </div>
        </section>

        <CtaBandSection />
      </main>
      <Footer />
    </>
  );
}
