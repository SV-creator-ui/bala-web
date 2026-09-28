import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AVIF pirma, tada WebP, tada JPEG fallback — ~30% mažesnės LCP nuotraukos
  // moderniose naršyklėse (Chrome, Firefox, Safari 16+). Padeda pagerinti
  // Core Web Vitals LCP metriką.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Dovanų kupono PDF šriftai + logotipas skaitomi per fs — įtraukiam juos į
  // serverless funkcijas, kurios generuoja PDF (kitaip Vercel jų neįtrauktų).
  outputFileTracingIncludes: {
    "/api/paysera/callback": ["./src/lib/voucher/assets/**", "./src/lib/booking/assets/**"],
    "/api/vouchers": ["./src/lib/voucher/assets/**"],
    "/api/bookings": ["./src/lib/booking/assets/**"],
    "/api/admin/vouchers/[id]": ["./src/lib/voucher/assets/**"],
    "/pabegimo-kambariai/dovanu-kuponas/patvirtinta": ["./src/lib/voucher/assets/**"],
    "/gimtadieniai/rezervacija/patvirtinta": ["./src/lib/booking/assets/**"],
  },
  async redirects() {
    // 308 (permanent: true) SEO požiūriu ekvivalentu 301 — Google supranta abu.
    // Nukreipimai nuo senų WordPress URL'ų (bala.lt prieš perkėlimą), kad
    // backlink'ai iš Facebook, direktorijų ir Google indeksuotų URL'ų nevestų į 404.
    return [
      { source: "/laisvas-zaidimas", destination: "/komandiniai-vr-zaidimai", permanent: true },
      { source: "/kontaktai", destination: "/pabegimo-kambariai#kontaktai", permanent: true },
      { source: "/apie-mus", destination: "/pabegimo-kambariai", permanent: true },
      { source: "/kambariai", destination: "/pabegimo-kambariai/kambariai", permanent: true },
      { source: "/vr-pabegimo-kambariai", destination: "/pabegimo-kambariai", permanent: true },
      { source: "/pabegimo-kambariai-klaipedoje", destination: "/pabegimo-kambariai", permanent: true },
      { source: "/dovanu-kuponas", destination: "/pabegimo-kambariai/dovanu-kuponas", permanent: true },
      { source: "/dovanu-kuponai", destination: "/pabegimo-kambariai/dovanu-kuponas", permanent: true },
      { source: "/gimtadienis", destination: "/gimtadieniai", permanent: true },
      { source: "/blog", destination: "/pabegimo-kambariai/blog", permanent: true },
      { source: "/blog/:slug", destination: "/pabegimo-kambariai/blog/:slug", permanent: true },
      { source: "/kaina", destination: "/pabegimo-kambariai#kainos", permanent: true },
      { source: "/kainos", destination: "/pabegimo-kambariai#kainos", permanent: true },
      // Google indeksavęs senus WP sitelink'us — nukreipiam į atitinkamus naujus
      { source: "/paslaugu-teikimo-salygos", destination: "/taisykles", permanent: true },
      { source: "/paslaugos", destination: "/pabegimo-kambariai", permanent: true },
      { source: "/privatumas", destination: "/privatumo-politika", permanent: true },
      { source: "/vr-veiksmo-zaidimai", destination: "/komandiniai-vr-zaidimai", permanent: true },

      // WordPress → Next.js migracijos liekanos, kurias Google vis dar bando indeksuoti
      // ir grąžina 404 (Search Console „Not found (404)"). Nukreipiam į artimiausią atitikmenį.

      // WooCommerce parduotuvė ir produktai — vienintelis buvęs produktas buvo dovanų kuponai
      { source: "/parduotuve", destination: "/pabegimo-kambariai/dovanu-kuponas", permanent: true },
      { source: "/parduotuve/:path*", destination: "/pabegimo-kambariai/dovanu-kuponas", permanent: true },
      { source: "/produktas/:slug*", destination: "/pabegimo-kambariai/dovanu-kuponas", permanent: true },

      // Senas blog spelling (lietuvinta forma)
      { source: "/blogas", destination: "/pabegimo-kambariai/blog", permanent: true },
      { source: "/blogas/:slug*", destination: "/pabegimo-kambariai/blog", permanent: true },

      // WordPress autoriaus archyvai — bala.lt niekada neturėjo prasmingų autorių puslapių
      { source: "/author/:name*", destination: "/", permanent: true },

      // RSS feed'ai — nauja svetainė RSS neturi, kad Google nustotų juos zonduoti
      { source: "/feed", destination: "/", permanent: true },
      { source: "/comments/feed", destination: "/", permanent: true },
      // Kiekvieno WP straipsnio RSS (pvz. /demo-naujiena-1/feed/)
      { source: "/:path/feed", destination: "/", permanent: true },
      { source: "/:path*/feed", destination: "/", permanent: true },

      // WordPress REST API endpoint'as (Google mato jį kaip 403)
      { source: "/wp-json", destination: "/", permanent: true },
      { source: "/wp-json/:path*", destination: "/", permanent: true },
      { source: "/wp-admin", destination: "/", permanent: true },
      { source: "/wp-login.php", destination: "/", permanent: true },

      // WordPress datos archyvai: /YYYY, /YYYY/MM, /YYYY/MM/DD, /YYYY/MM/DD/slug
      // Konstruoti su regex constraint'ais, kad NEsutaptų su tikrais slug'ais
      { source: "/:year(\\d{4})", destination: "/", permanent: true },
      { source: "/:year(\\d{4})/:month(\\d{2})", destination: "/", permanent: true },
      { source: "/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})", destination: "/", permanent: true },
      { source: "/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug", destination: "/", permanent: true },

      // Bendras VR pabegimo kambarių slug'as senoje versijoje — dengiam žinomus variantus
      { source: "/vr-pabegimo-kambariai-klaipedoje", destination: "/pabegimo-kambariai", permanent: true },
      { source: "/vr-pabegimo-kambarys", destination: "/pabegimo-kambariai", permanent: true },
      { source: "/vr-pabegimo-kambarys-klaipedoje", destination: "/pabegimo-kambariai", permanent: true },
      // Kažkas kadaise dalinosi nukirstą linką — Google jį vis dar žino
      { source: "/vr-pabegimo-", destination: "/pabegimo-kambariai", permanent: true },
    ];
  },
  // Next.js šriftams ir statiniams media asset'ams pasakom Google'iui jų neindeksuoti —
  // jie nėra turinys, tik prerender'is. Tvarko Search Console „Crawled – currently not indexed".
  async headers() {
    return [
      {
        source: "/_next/static/media/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
