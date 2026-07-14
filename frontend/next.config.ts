import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpackDevMiddleware: {
    poll: 1000,
  },
};

export default nextConfig;
