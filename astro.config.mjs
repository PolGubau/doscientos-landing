import { rehypeHeadingIds } from '@astrojs/markdown-remark'
// @ts-check
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import icon from 'astro-icon'
import metaTags from 'astro-meta-tags'
import { defineConfig } from 'astro/config'
import rehypeExternalLinks from 'rehype-external-links'

// https://astro.build/config
export default defineConfig({
  site: 'https://doscientos.es',
  output: 'static',
  trailingSlash: 'never',
  prefetch: { defaultStrategy: 'hover' },

  redirects: {
    '/trabaja-con-nosotros': '/jobs',
    '/careers': '/jobs',
    '/carrer': '/jobs',
  },

  experimental: {
    headingIdCompat: true,
    contentIntellisense: true,
  },

  integrations: [mdx(), metaTags(), react(), icon({ iconDir: 'src/assets/icons' })],
  markdown: {
    rehypePlugins: [
      rehypeHeadingIds,
      [
        rehypeExternalLinks,
        {
          rel: ['noopener', 'noreferrer'],
        },
      ],
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        usePolling: false,
        ignored: ['**/node_modules/**', '**/.git/**'],
      },
    },
  },
})
