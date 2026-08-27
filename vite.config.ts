import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      // Avoid CORS preflight 405 in dev — browser -> Vite (same origin) -> Render
      // Use VITE_API_BASE_URL="" or "/api" in dev to hit this proxy.
      "/api": {
        target: "https://preuvio-api.onrender.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
