/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Exclude packages from SSR bundling
  serverExternalPackages: ["@react-pdf/renderer", "@prisma/client", "prisma"],
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
  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://api.openai.com https://api.sendgrid.com https://api.stripe.com; frame-src https://js.stripe.com;"
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
        ],
      },
    ];
  },
};

export default nextConfig;
