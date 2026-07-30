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
  title: "Vaikų gimtadieniai — BALA VR Klaipėda",
  description:
    "220 m² privati VR erdvė iki 23 žaidėjų Klaipėdoje. Nepamirštami vaikų gimtadieniai — vaikai žaidžia, tėvai ilsisi.",
};

export default function GimtadieniaiLayout({ children }) {
  return (
    <div className={`gimt ${poppins.variable} ${openSans.variable}`}>
      {children}
    </div>
  );
}
