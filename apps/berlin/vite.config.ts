import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { readBerlinCatalog } from '@machtblick/berlin-db/client'
import { prerenderPaths } from './build/prerenderPaths'

export default defineConfig(({ command }) => ({
  define: { __DATA_LAST_MODIFIED__: JSON.stringify(readBerlinCatalog().retrievedAt) },
  server: {
    port: 5176,
    host: true,
    allowedHosts: ['berlin.machtblick.de', 'localhost', '127.0.0.1']
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    tailwindcss(),
    tanstackStart({
      pages: command === 'build' ? prerenderPaths().map((path) => ({ path })) : [],
      prerender: { enabled: true, crawlLinks: false, concurrency: 2 },
      spa: { enabled: false }
    }),
    viteReact()
  ]
}))
