/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      'picsum.photos',
      'images.unsplash.com',
      'randomuser.me',
      'example.com'
    ],
    formats: ['image/webp', 'image/avif'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  swcMinify: true,
}

module.exports = nextConfig 