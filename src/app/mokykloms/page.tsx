import type { Metadata } from "next";
import GroupLanding from "@/components/groups/GroupLanding";

export const metadata: Metadata = {
  title: { absolute: "VR pramogos mokykloms ir klasių išvykos Klaipėdoje | BALA VR" },
  description:
    "Klasės išvyka, šventė ar mokslo metų pabaiga: atvykite į BALA VR Klaipėdoje arba pakvieskite mus į mokyklą. Siųskite užklausą — pasiūlysime programą.",
  alternates: { canonical: "/mokykloms" },
};

export default function MokyklomsPage() {
  return (
    <GroupLanding
      kind="mokykla"
      path="/mokykloms"
      crumb="Mokykloms"
      title={
        <>
          VR pramogos <span className="text-volt">mokykloms</span>
        </>
      }
      lead="Klasės išvyka, šventė ar mokslo metų pabaiga. Atvykite pas mus į Klaipėdą arba pakvieskite BALA VR į savo mokyklą."
      image="/moments/m-2.webp"
      imageAlt="Moksleivių klasė BALA VR erdvėje"
      offersTitle="Du būdai švęsti su klase"
      offers={[
        {
          title: "Klasė atvyksta į BALA VR",
          text: "Privati 220 m² erdvė klasei: komandiniai VR žaidimai, interaktyvi siena, arkados ir vieta vaišėms. Pajūrio g. 5B, Klaipėda.",
        },
        {
          title: "BALA VR atvyksta į mokyklą",
          text: "VR pramogos jūsų mokyklos renginiui ar klasės šventei. Parašykite mokyklą, mokinių skaičių ir datą — suderinsime sąlygas.",
        },
      ]}
      points={[
        "Jokios VR patirties nereikia — instruktorius viską paaiškins",
        "Pramogos nuo 7 metų",
        "Veiklos visai klasei, ne tik keliems mokiniams",
        "Tinka Kalėdoms, gimtadieniams ir mokslo metų pabaigai",
      ]}
      formTitle="Planuokite klasės šventę"
    />
  );
}
