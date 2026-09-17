import { Poppins, Open_Sans } from "next/font/google";
import "./gimt.css";

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata = {
  title: { absolute: "Vaikų gimtadieniai Klaipėdoje | BALA VR" },
  description:
    "Vaikų gimtadieniai Klaipėdoje su VR žaidimais, interaktyvia siena ir kitomis pramogomis. Privati 220 m² erdvė šventei vaikams nuo 7 metų.",
  alternates: { canonical: "/gimtadieniai" },
};

export default function GimtadieniaiLayout({ children }) {
  return (
    <div className={`gimt ${poppins.variable} ${openSans.variable}`}>
      {children}
    </div>
  );
}
