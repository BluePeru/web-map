/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/mapa',
        destination: '/',
      },
    ];
  },
};

export default nextConfig;
