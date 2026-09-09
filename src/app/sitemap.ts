import type { MetadataRoute } from "next";
import { GAMES } from "@/lib/bala-data";

const BASE = "https://bala.lt";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
    { path: "", priority: 1.0, changeFrequency: "weekly" },
    { path: "/pabegimo-kambariai", priority: 0.9, changeFrequency: "weekly" },
    { path: "/pabegimo-kambariai/kambariai", priority: 0.85, changeFrequency: "weekly" },
    { path: "/pabegimo-kambariai/dovanu-kuponas", priority: 0.85, changeFrequency: "monthly" },
    { path: "/pabegimo-kambariai/blog", priority: 0.7, changeFrequency: "weekly" },
    { path: "/pabegimo-kambariai/blog/kas-yra-vr-pabegimo-kambarys", priority: 0.6, changeFrequency: "yearly" },
    { path: "/pabegimo-kambariai/blog/5-pramogos-klaipedoje", priority: 0.6, changeFrequency: "yearly" },
    { path: "/gimtadieniai", priority: 0.9, changeFrequency: "weekly" },
    { path: "/gimtadieniai/rezervacija", priority: 0.7, changeFrequency: "monthly" },
    { path: "/komandiniai-vr-zaidimai", priority: 0.85, changeFrequency: "monthly" },
    { path: "/komandiniai-vr-zaidimai/rezervacija", priority: 0.6, changeFrequency: "monthly" },
    { path: "/rezervacija", priority: 0.8, changeFrequency: "monthly" },
    { path: "/privatumo-politika", priority: 0.3, changeFrequency: "yearly" },
    { path: "/taisykles", priority: 0.3, changeFrequency: "yearly" },
  ];

  const staticEntries = staticRoutes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const gameEntries = GAMES.map((g) => ({
    url: `${BASE}/pabegimo-kambariai/kambariai/${g.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...gameEntries];
}
