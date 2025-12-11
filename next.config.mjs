/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Exclude @react-pdf/renderer from SSR to avoid Html import issue
  serverExternalPackages: ["@react-pdf/renderer"],
  webpack: (config, { isServer }) => {
    // Handle @react-pdf/renderer for server-side rendering
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        "@react-pdf/renderer": "commonjs @react-pdf/renderer",
      });
    }
    return config;
  },
};

export default nextConfig;
