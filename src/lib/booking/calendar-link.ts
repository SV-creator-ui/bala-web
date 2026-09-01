/**
 * Kliento „Pridėti į Google kalendorių" nuoroda (be jokių slaptažodžių).
 * Grąžina Google Calendar šablono URL — klientas vienu paspaudimu įsideda
 * savo rezervaciją į savo kalendorių.
 */
import type { BookingRow } from "@/lib/supabase/server";
import { toHHMM } from "@/lib/booking/config";
import { getPartyPackage } from "./packages";
import { activityEndMin } from "./window";

export function googleCalendarRenderUrl(b: BookingRow): string {
  const isParty = b.type === "party";
  const pkg = isParty ? getPartyPackage(b.package_id ?? "") : undefined;
  const title = isParty
    ? `BALA VR gimtadienis${pkg ? " " + pkg.name : ""}`
    : b.type === "game"
    ? "BALA VR komandiniai žaidimai"
    : "BALA VR pabėgimo kambarys";

  // Klientui rodome tik pačios šventės/apsilankymo langą (be tvarkymosi buferio —
  // tvarkosi žaidimų kambarys, ne klientas).
  const addons = Array.isArray(b.addons) ? (b.addons as unknown[]).map(String) : [];
  const start = b.time;
  const end = toHHMM(activityEndMin(b.type, b.time, b.package_id, addons));
  const fmt = (hhmm: string) => `${b.date.replace(/-/g, "")}T${hhmm.replace(":", "")}00`;
  const dates = `${fmt(start)}/${fmt(end)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    details: `Rezervacijos nr.: ${b.merchant_reference}. Likutį sumokėsite vietoje.`,
    location: "BALA VR, Pajūrio g. 5B, Klaipėda",
    ctz: "Europe/Vilnius",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
