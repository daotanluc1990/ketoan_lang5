import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  outputFileTracingRoot: process.cwd(),
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    cpus: 1
  }
};

export default nextConfig;
