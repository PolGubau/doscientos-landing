// @ts-check
import mdx from "@astrojs/mdx";
import icon from "astro-icon";
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import metaTags from "astro-meta-tags";

import react from "@astrojs/react";

import { rehypeHeadingIds } from "@astrojs/markdown-remark";
import rehypeExternalLinks from "rehype-external-links";

// https://astro.build/config
export default defineConfig({
  site: "https://doscientos.es",
  output: "static",
  trailingSlash: "never",
  prefetch: { defaultStrategy: "hover" },

  redirects: {
    "/trabaja-con-nosotros": "/jobs",
    "/careers": "/jobs",
    "/carrer": "/jobs",
  },

  experimental: {
    headingIdCompat: true,
    contentIntellisense: true,
  },

  integrations: [
    mdx(),
    metaTags(),
    react(),
    icon({ iconDir: "src/assets/icons" }),
  ],
  markdown: {
    rehypePlugins: [
      rehypeHeadingIds,
      [
        rehypeExternalLinks,
        {
          rel: ["noopener", "noreferrer"],
        },
      ],
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        usePolling: false,
        ignored: ["**/node_modules/**", "**/.git/**"],
      },
    },
  },
});
