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

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../backend/static',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/index.html'),
    },
  },
  server: { host: 'localhost', port: 5173, strictPort: true },
  base: '/static/',
})