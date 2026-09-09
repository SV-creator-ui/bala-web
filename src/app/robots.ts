import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/rezervacija/patvirtinta",
          "/gimtadieniai/rezervacija/patvirtinta",
          "/komandiniai-vr-zaidimai/rezervacija/patvirtinta",
          "/pabegimo-kambariai/dovanu-kuponas/patvirtinta",
        ],
      },
    ],
    sitemap: "https://bala.lt/sitemap.xml",
    host: "https://bala.lt",
  };
}
