/**
 * Viešų pasiūlymų (nuolaidų) VIENAS TIESOS ŠALTINIS rodymui svetainėje:
 * juosta viršuje, hero ženkliukas, kainų kortelės, apatinė skatinimo juosta.
 * Pati suma imama iš packages.ts (ta pati, kuri taikoma skaičiuojant kainą),
 * todėl tekstai niekada nesiskirs nuo tikros nuolaidos.
 *
 * Išjungti visur vienu kartu: `active: false`.
 */
import { PARTY_PACKAGES, PARTY_WEEKDAY_DISCOUNT_EUR } from "./booking/packages";

const amount = PARTY_WEEKDAY_DISCOUNT_EUR;

export const WEEKDAY_OFFER = {
  /** Keiskite id, kai keičiasi pasiūlymas — juosta vėl parodoma tiems, kas ją buvo uždarę. */
  id: "party-weekday-eur20",
  active: true,
  amountEur: amount,
  /** „−20 €" — vienodas užrašas visur */
  amountLabel: `−${amount} €`,
  /** Pilnas užrašas — vienodas visur (juosta, hero, apatinis blokas) */
  label: `−${amount} € NUOLAIDA I–IV dieniais`,
  /** Trumpas užrašas kainų kortelėje */
  cardLabel: `−${amount} € NUOLAIDA`,
  daysLabel: "I–IV dieniais",
  barText: `−${amount} € NUOLAIDA I–IV dieniais`,
  barCta: "Rezervuoti",
  href: "/gimtadieniai/rezervacija",
} as const;

/** Paketo kaina pirm.–ketv. (bazinė − nuolaida). */
export function weekdayPackagePrice(pkgId: string): number | null {
  const p = PARTY_PACKAGES.find((x) => x.id === pkgId);
  return p ? p.price - amount : null;
}
