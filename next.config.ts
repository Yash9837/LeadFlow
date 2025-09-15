/** @type {import('next').NextConfig} */
const nextConfig = {
  // This enables CSS optimization which uses lightningcss
  experimental: {
    optimizeCss: true,
  },
  // Optional: If you're using styled-components
  compiler: {
    styledComponents: true,
  },
}

module.exports = nextConfig
