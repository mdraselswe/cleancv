import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Chromium's own binaries, carried into the serverless function.
   *
   * `@sparticuz/chromium` is already in Next's list of auto-externalised
   * packages, so it is `require`d at runtime rather than bundled — which is
   * right, and not enough. The 67 MB of Brotli archives in its `bin/` folder
   * are opened at runtime from a path the package computes for itself, and file
   * tracing only follows imports it can see. Nothing imports a `.br` file, so
   * nothing traced them, and the deployed function had the library without the
   * browser:
   *
   *   The input directory "/var/task/node_modules/@sparticuz/chromium/bin"
   *   does not exist.
   *
   * Scoped to the one route that launches a browser. Every other function stays
   * 67 MB lighter, which on a platform with a 250 MB unzipped ceiling is the
   * difference between deploying and not.
   */
  outputFileTracingIncludes: {
    '/api/pdf': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
};

export default nextConfig;
