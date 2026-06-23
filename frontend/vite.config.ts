import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Прокси /api на бэкенд в режиме разработки.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
