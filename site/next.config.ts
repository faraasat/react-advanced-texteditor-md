import { resolve } from "node:path";
import type { NextConfig } from "next";

// GitHub Pages serves this project from /<repo>, and has no Node runtime, so the demo is a fully static export.
// `npm run site:build` in the repository root sets the base path; a plain `next build` here serves from "/".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // The demos read their own source (src/demos) and the docs read README.md and CHANGELOG.md from the repository root.
  turbopack: { root: resolve(process.cwd(), "..") },
};

export default nextConfig;
