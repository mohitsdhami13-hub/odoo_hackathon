import path from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.alias["next-auth/react"] = path.resolve(
      __dirname,
      "node_modules/next-auth/react.js"
    );
    return config;
  },
};

export default nextConfig;
