import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.pandascore.co" },
      { protocol: "https", hostname: "static-cdn.jtvnw.net" },
      // Avatars Google
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Avatars Discord
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
