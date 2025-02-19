import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["image.tmdb.org"], // ✅ Add TMDb image domain
  },
};

export default nextConfig;
