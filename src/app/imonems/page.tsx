import type { Metadata } from "next";
import GroupLanding from "@/components/groups/GroupLanding";

export const metadata: Metadata = {
  title: { absolute: "Renginiai įmonėms ir teambuildingas Klaipėdoje | BALA VR" },
  description:
    "Komandos formavimas, kalėdinis vakarėlis ar kolektyvo šventė privačioje 220 m² VR erdvėje Klaipėdoje. VR pabėgimo kambariai, komandiniai VR žaidimai, arkados. Gaukite pasiūlymą.",
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
      lead="Komandos formavimas (teambuildingas), kalėdinis vakarėlis ar kolektyvo šventė privačioje VR erdvėje Klaipėdoje. Parašykite, kiek jūsų bus — pasiūlysime programą."
      image="/moments/m-1.webp"
      imageAlt="Kolektyvas žaidžia VR žaidimus BALA VR erdvėje"
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
      ]}
      points={[
        "Jokios VR patirties nereikia — instruktorius viską paaiškins",
        "Privati erdvė tik jūsų kolektyvui",
        "Vieta vaišėms ir pabendravimui",
        "Patogu atvykti: Pajūrio g. 5B, Klaipėda",
      ]}
      formTitle="Gaukite pasiūlymą kolektyvui"
    />
  );
}
