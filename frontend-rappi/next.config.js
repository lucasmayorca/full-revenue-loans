/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: "standalone" solo para Docker — Vercel usa su propio build pipeline
};

module.exports = nextConfig;
