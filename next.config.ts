import type { NextConfig } from "next";

process.env.CSS_TRANSFORMER_WASM ??= "1";
process.env.NAPI_RS_FORCE_WASI ??= "1";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      { source: "/byo", destination: "/connect", permanent: true },
    ];
  },
};

export default nextConfig;
