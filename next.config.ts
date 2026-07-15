import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Keep Turbopack inside this checkout when a parent directory contains
  // unrelated package-manager lockfiles.
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
