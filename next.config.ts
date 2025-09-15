/** @type {import('next').NextConfig} */
const nextConfig = {
  // This enables CSS optimization which uses lightningcss
  experimental: {
    optimizeCss: false,
  },
  // Optional: If you're using styled-components
  compiler: {
    styledComponents: true,
  },
}

module.exports = nextConfig