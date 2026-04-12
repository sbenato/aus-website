import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
