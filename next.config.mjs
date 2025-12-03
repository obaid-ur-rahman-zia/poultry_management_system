/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper module resolution
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": require("path").resolve(__dirname),
    };
    return config;
  },
};

export default nextConfig;
