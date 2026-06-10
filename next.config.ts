import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixtures and prompts are read from disk at request time (fixtures power
  // demo mode; prompts power live re-runs), so they must ship with the
  // serverless bundle on Vercel.
  outputFileTracingIncludes: {
    "/**/*": ["./fixtures/**/*", "./prompts/**/*", "./rubric/**/*"],
  },
  // Pin the workspace root so stray lockfiles elsewhere on a machine never
  // change how this builds.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
