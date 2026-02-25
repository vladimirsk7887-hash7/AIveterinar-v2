import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        landing: resolve(__dirname, 'landing.html'),
        admin: resolve(__dirname, 'admin.html'),
        superadmin: resolve(__dirname, 'superadmin.html'),
        widget: resolve(__dirname, 'widget.html'),
        tg: resolve(__dirname, 'tg-mini-app.html'),
      },
    },
  },
})
