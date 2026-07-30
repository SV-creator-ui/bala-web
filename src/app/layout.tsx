import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BALA VR — pramogos Klaipėdoje",
  description:
    "BALA VR Klaipėdoje: VR pabėgimo kambariai ir vaikų gimtadieniai. Pasirink savo nuotykį. Pajūrio g. 5B, Klaipėda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lt" className={`${anton.variable} ${archivo.variable}`}>
      <body className="bg-ink text-white font-body antialiased">{children}</body>
    </html>
  );
}
