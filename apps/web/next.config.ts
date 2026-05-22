import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @aus/scramble se publica como TS/TSX crudo; Next debe transpilarlo.
  transpilePackages: ["@aus/scramble"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.worldcubeassociation.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.worldcubeassociation.org",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
