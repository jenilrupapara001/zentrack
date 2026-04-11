import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      },
      // Proxy all routes that are not static assets to backend
      '^/(auth|excel|logs|emails|sample)/': {
        target: 'http://localhost:5002',
        changeOrigin: true,
      }
    }
  }
});
