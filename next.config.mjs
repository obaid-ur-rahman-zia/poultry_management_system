/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper module resolution
  output: "standalone",
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": require("path").resolve(__dirname),
    };
    return config;
  },
};

export default nextConfig;
