import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";

import tailwindcss from "@tailwindcss/vite";

const adapter =
  process.env.VERCEL === "1"
    ? vercel({ maxDuration: 60 })
    : node({
        mode: "standalone",
      });

export default defineConfig({
  integrations: [react()],
  output: "server",
  adapter,
  security: {
    allowedDomains: [
      { hostname: "www.bluu3.com", protocol: "https" },
      { hostname: "bluu3.com", protocol: "https" },
      { hostname: "piscines-sas-laqe.vercel.app", protocol: "https" },
      ...(process.env.VERCEL_URL
        ? [{ hostname: process.env.VERCEL_URL, protocol: "https" }]
        : []),
      ...(process.env.VERCEL_BRANCH_URL
        ? [{ hostname: process.env.VERCEL_BRANCH_URL, protocol: "https" }]
        : []),
      { hostname: "localhost", protocol: "http" },
      { hostname: "127.0.0.1", protocol: "http" },
    ],
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
