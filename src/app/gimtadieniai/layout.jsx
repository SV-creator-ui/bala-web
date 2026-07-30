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
  title: "Gimtadienis BALA VR | Klaipėda",
  description:
    "Privati 220 m² BALA VR erdvė vaikų gimtadieniams Klaipėdoje: VR misijos, interaktyvi siena, nemokami arkadiniai žaidimai, instruktoriaus priežiūra ir poilsio zona tėvams.",
};

export default function GimtadieniaiLayout({ children }) {
  return (
    <div className={`gimt ${poppins.variable} ${openSans.variable}`}>
      {children}
    </div>
  );
}
