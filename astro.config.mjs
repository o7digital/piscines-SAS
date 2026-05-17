import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";

import tailwindcss from "@tailwindcss/vite";

const adapter =
  process.env.VERCEL === "1"
    ? vercel()
    : node({
        mode: "standalone",
      });

export default defineConfig({
  integrations: [react()],
  output: "server",
  adapter,

  vite: {
    plugins: [tailwindcss()],
  },
});
