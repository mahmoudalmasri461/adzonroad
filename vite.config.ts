import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5183,
    strictPort: false,
  },
  preview: {
    port: Number(process.env.PORT) || 4183,
    strictPort: false,
  },
})
