// @ts-check
import mdx from "@astrojs/mdx";
import icon from "astro-icon";
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import metaTags from "astro-meta-tags";

import react from "@astrojs/react";

import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import vercel from "@astrojs/vercel";
import rehypeExternalLinks from 'rehype-external-links';


// https://astro.build/config
export default defineConfig({
  site: "https://doscientos.es",
  output: "static",
  trailingSlash: "never",
  prefetch: true,

  redirects: {
    "/trabaja-con-nosotros": "/jobs",
    "/careers": "/jobs",
    "/carrer": "/jobs",
    "/en": "/",
    "/ca": "/",
    "/en/blog": "/blog",
    "/ca/blog": "/blog",
    "/en/blog/[...slug]": "/blog/[...slug]",
    "/ca/blog/[...slug]": "/blog/[...slug]",
    "/en/projects": "/projects",
    "/ca/projects": "/projects",
    "/en/projects/[...slug]": "/projects/[...slug]",
    "/ca/projects/[...slug]": "/projects/[...slug]",
    "/en/privacy": "/privacy",
    "/ca/privacy": "/privacy",
    "/en/cookies": "/cookies",
    "/ca/cookies": "/cookies",
    "/en/contact": "/contact",
    "/ca/contact": "/contact",
    "/en/legal": "/legal",
    "/ca/legal": "/legal",
    "/en/terminos": "/terminos",
    "/ca/terminos": "/terminos",
  },

  experimental: {
    headingIdCompat: true,
    contentIntellisense: true

  },

  i18n: {
    locales: ["es"],
    defaultLocale: "es",
    routing: {
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    mdx(),
    metaTags(),
    react({ experimentalReactChildren: true }),
    icon({ iconDir: "src/assets/icons" }),
  ],
  markdown: {
    rehypePlugins: [
      rehypeHeadingIds,
      [
        rehypeExternalLinks,
        {
          content: { type: 'text', value: ' 🔗' }
        }
      ],
    ]
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["astro:content"],
      include: ["react", "react-dom"],
    },
    server: {
      fs: {
        strict: false,
      },
      watch: {
        usePolling: false,
        ignored: ["**/node_modules/**", "**/.git/**"],
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks para mejor caching
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('@astrojs')) {
                return 'vendor-astro';
              }
              return 'vendor';
            }
          },
        },
      },
    },
  },

  adapter: vercel(),
});