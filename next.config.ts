import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: false,
  outputFileTracingRoot: process.cwd(),
  typescript: {
    ignoreBuildErrors: true
  },
  experimental: {
    cpus: 1
  }
};

// eslint.ignoreDuringBuilds không thuộc type NextConfig chuẩn nhưng Next hỗ trợ.
// Gán runtime để tránh TS error mà vẫn giữ behavior.
Object.assign(nextConfig, { eslint: { ignoreDuringBuilds: true } });

export default nextConfig;
