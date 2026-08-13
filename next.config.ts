import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
