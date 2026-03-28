import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/aida-public/**",
      },
      {
        protocol: "http",
        hostname: "52.79.250.143",
        port: "8000",
        pathname: "/api/v1/images/**",
      },
    ],
  },
};

export default nextConfig;
