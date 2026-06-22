import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const rootModules = path.resolve(__dirname, '../../node_modules')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    fs: { allow: ['../..'] },
  },
  resolve: {
    alias: {
      '@': '/src',
      // Resolve hoisted monorepo dependencies from root node_modules
      'recharts': path.resolve(rootModules, 'recharts'),
    },
  },
})