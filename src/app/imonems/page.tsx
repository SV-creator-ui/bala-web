import type { Metadata } from "next";
import GroupLanding from "@/components/groups/GroupLanding";

export const metadata: Metadata = {
  title: { absolute: "Renginiai įmonėms ir teambuildingas Klaipėdoje | BALA VR" },
  description:
    "Komandos formavimas, kalėdinis vakarėlis ar kolektyvo šventė privačioje 220 m² VR erdvėje Klaipėdoje arba jūsų įmonėje — atvažiuojame su VR įranga. Gaukite pasiūlymą.",
  alternates: { canonical: "/imonems" },
};

export default function ImonemsPage() {
  return (
    <GroupLanding
      kind="imone"
      path="/imonems"
      crumb="Įmonėms"
      title={
        <>
          Renginiai <span className="text-volt">įmonėms</span>
        </>
      }
      lead="Komandos formavimas (teambuildingas), kalėdinis vakarėlis ar kolektyvo šventė — mūsų privačioje VR erdvėje Klaipėdoje arba jūsų įmonėje. Parašykite, kiek jūsų bus — pasiūlysime programą."
      image="/kolektyvai/komandos-formavimas-vr-klaipeda.webp"
      imageAlt="Kolektyvas žaidžia VR žaidimą BALA VR erdvėje Klaipėdoje"
      offersTitle="Ką galime suorganizuoti"
      offers={[
        {
          title: "VR pabėgimo kambarys",
          text: "50 min. komandinis galvosūkių iššūkis. Didesnė grupė gali žaisti keliomis komandomis viena šalia kitos.",
        },
        {
          title: "VR veiksmo žaidimai",
          text: "Aktyvios komandinės varžybos: zombiai, kovos, magija. Daug judesio ir juoko.",
        },
        {
          title: "Privatus renginys",
          text: "Visa 220 m² erdvė jūsų kolektyvui: VR žaidimai, interaktyvi siena, arkados ir vieta vaišėms.",
        },
        {
          title: "Atvažiuojame į jūsų įmonę",
          text: "Atvežame VR įrangą į jūsų biurą ar renginio vietą ir viską paruošiame. Parašykite vietą, dalyvių skaičių ir datą.",
        },
      ]}
      points={[
        "Jokios VR patirties nereikia — instruktorius viską paaiškins",
        "Privati erdvė tik jūsų kolektyvui",
        "Vieta vaišėms ir pabendravimui",
        "Pas mus Pajūrio g. 5B, Klaipėda — arba atvažiuojame pas jus",
      ]}
      formTitle="Gaukite pasiūlymą kolektyvui"
      galleryTitle="Renginiai įmonių biuruose"
      gallery={[
        { src: "/kolektyvai/kolektyvo-renginys-vr-1.webp", alt: "Kolektyvo nariai su VR akiniais komandos formavimo renginyje" },
        { src: "/kolektyvai/kolektyvo-renginys-vr-2.webp", alt: "Komanda žaidžia VR veiksmo žaidimą" },
        { src: "/kolektyvai/kolektyvo-renginys-vr-3.webp", alt: "Darbuotoja žaidžia VR žaidimą su BALA VR akiniais" },
      ]}
    />
  );
}
