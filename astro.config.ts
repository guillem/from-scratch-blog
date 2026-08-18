import { defineConfig } from "astro/config";
import netlify from "@astrojs/netlify";

const siteUrl =
  process.env.SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "http://localhost:4321";

export default defineConfig({
  site: siteUrl,
  output: "server",
  adapter: netlify(),
  security: {
    checkOrigin: true,
  },
});
