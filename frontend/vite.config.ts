/*import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  root: "src",
  plugins: [react()],
})
*/

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import * as  path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // New config to copy font files
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/@excalidraw/excalidraw/dist/prod/*',
          dest: 'excalidraw-assets'
        }
      ]
    })
  ],
  build: {
    outDir: '../backend/static',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main.tsx'),
    },
  },
  server: { host: 'localhost', port: 5173, strictPort: true },
  base: '/static/',
})
