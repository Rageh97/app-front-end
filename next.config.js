const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
   typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
   webpack: (config) => {
    config.resolve.fallback = { 
      fs: false,
      path: false,
      'jsvectormap/dist/css/jsvectormap.css': false
    };
    return config;
  },
  // distDir: "build",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "healtystorages.s3.amazonaws.com" ,
        port: "",
      },
    ],
  },
};

module.exports = withBundleAnalyzer(nextConfig);
