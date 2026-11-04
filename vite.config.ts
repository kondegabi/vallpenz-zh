/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  // relatív útvonalak: a GitHub Pages almappájában, a Netlify-on és az exe-ből is ugyanaz a build fut
  base: './',
  plugins: [react()],
  // a KaTeX és a React együtt ~550 kB (gzip ~170 kB); ez várt méret, nem hiba
  build: { chunkSizeWarningLimit: 700 },
  test: {
    environment: 'node',
  },
})
