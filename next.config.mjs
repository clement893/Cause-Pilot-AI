/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Disable static page generation for error pages to avoid Html import issue
  experimental: {
    // This helps with Railway deployment
  },
};

export default nextConfig;
