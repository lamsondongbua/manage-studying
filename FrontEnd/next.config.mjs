/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Thêm dòng này
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  reactStrictMode: false,
};
export default nextConfig;
