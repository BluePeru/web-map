/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/mapa',
  async rewrites() {
    return [
      {
        source: '/api/tiles/:path*',
        destination: `${(process.env.BLUE_API_BASE_URL || 'https://dev.b1peru.com/api').replace(/\/$/, '')}/v1/tiles/:path*`,
      },
    ];
  },
};

export default nextConfig;
