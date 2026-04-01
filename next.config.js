/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.R2_PUBLIC_HOSTNAME ?? 'images.municipiocollector.es',
        pathname: '/escudos/**',
      },
    ],
  },
};

module.exports = nextConfig;