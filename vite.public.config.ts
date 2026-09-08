import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  define: { __PUBLIC_MODE__: 'true' },
  base: '/smart-menu-planner/',
  build: {
    outDir: 'dist-public',
    assetsDir: 'assets',
    target: 'es2020',
    emptyOutDir: true,
  },
})
