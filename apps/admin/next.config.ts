import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const config: NextConfig = {
  output: "standalone",
  transpilePackages: ["@kidz/domain", "@kidz/contracts"],
  turbopack: {
    root: workspaceRoot,
  },
};

export default config;
