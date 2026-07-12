import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { prerenderPaths } from './build/prerenderPaths'
import { writeSitemap } from './build/sitemap'
import { writeVotesFeed } from './build/votesFeed'
import { writeJsonEndpoints } from './build/jsonEndpoints'
import { latestVoteDate } from './build/latestVoteDate'

export default defineConfig(({ command }) => {
  const building = command === 'build'
  if (building) {
    writeSitemap()
    writeVotesFeed()
    writeJsonEndpoints()
  }
  return {
    define: { __DATA_LAST_MODIFIED__: JSON.stringify(latestVoteDate()) },
    server: { port: 3000, host: true, allowedHosts: ['dev.machtblick.de'] },
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    plugins: [
      tailwindcss(),
      tanstackStart({
        pages: building ? prerenderPaths().map((path) => ({ path })) : [],
        prerender: { enabled: true, crawlLinks: false },
        spa: { enabled: false },
      }),
      viteReact(),
    ],
  }
})
