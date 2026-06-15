import type { NextConfig } from "next";

// Turbopack is the default bundler in Next 16 — do NOT add a `webpack` key here.
// `transpilePackages` lets this app compile the shared @cueword/core TS source.
const nextConfig: NextConfig = {
  transpilePackages: ["@cueword/core"],
};

export default nextConfig;
