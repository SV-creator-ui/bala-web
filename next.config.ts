import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
