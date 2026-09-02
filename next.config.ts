import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dovanų kupono PDF šriftai + logotipas skaitomi per fs — įtraukiam juos į
  // serverless funkcijas, kurios generuoja PDF (kitaip Vercel jų neįtrauktų).
  outputFileTracingIncludes: {
    "/api/paysera/callback": ["./src/lib/voucher/assets/**"],
    "/api/vouchers": ["./src/lib/voucher/assets/**"],
    "/api/admin/vouchers/[id]": ["./src/lib/voucher/assets/**"],
    "/pabegimo-kambariai/dovanu-kuponas/patvirtinta": ["./src/lib/voucher/assets/**"],
  },
  async redirects() {
    return [
      {
        source: "/laisvas-zaidimas",
        destination: "/komandiniai-vr-zaidimai",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
