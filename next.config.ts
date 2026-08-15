import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /**
     * Samo za Fazu 0 — demo koristi stock portrete i nasumične fotografije.
     * U Fazi 1 se zamenjuje sopstvenim bucket-om (Cloudflare R2) i ova lista se briše.
     */
    remotePatterns: [
      { protocol: "https", hostname: "randomuser.me" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
