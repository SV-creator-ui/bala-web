import type { Metadata } from "next";
import { Anton, Archivo } from "next/font/google";
import LocalBusinessJsonLd from "@/components/bala/LocalBusinessJsonLd";
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
  metadataBase: new URL("https://bala.lt"),
  title: {
    default: "BALA VR Klaipėda — VR pabėgimo kambariai, gimtadieniai, dovanų kuponai",
    template: "%s | BALA VR Klaipėda",
  },
  description:
    "BALA VR Klaipėdoje (Pajūrio g. 5B): 9 VR pabėgimo kambariai, privatūs vaikų gimtadieniai, VR veiksmo žaidimai ir dovanų kuponai. Nuo €20/asm.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "lt_LT",
    siteName: "BALA VR",
    url: "https://bala.lt",
    title: "BALA VR Klaipėda — pramogos, kurių neužmirši",
    description:
      "9 VR pabėgimo kambariai, gimtadieniai vaikams, VR veiksmo žaidimai ir dovanų kuponai. Pajūrio g. 5B, Klaipėda.",
    images: [
      {
        url: "/assets/logo-bala-vr.png",
        width: 1200,
        height: 630,
        alt: "BALA VR — pramogos Klaipėdoje",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BALA VR Klaipėda",
    description: "VR pabėgimo kambariai, gimtadieniai, dovanų kuponai.",
    images: ["/assets/logo-bala-vr.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lt" className={`${anton.variable} ${archivo.variable}`}>
      <body className="bg-ink text-white font-body antialiased">
        <LocalBusinessJsonLd />
        {children}
      </body>
    </html>
  );
}
