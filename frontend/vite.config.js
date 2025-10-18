import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    // Copy VvvebJs assets to dist folder during build
    viteStaticCopy({
      targets: [
        {
          src: 'src/libs/VvvebJs-master',
          dest: 'src/libs'
        }
      ]
    })
  ],
  publicDir: false, // Disable public folder to avoid dependency on it
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        ws: true // Habilitar WebSocket proxy
      }
    },
    hmr: {
      port: 5173 // Puerto específico para HMR
    }
  },
  optimizeDeps: {
    include: ['@tanstack/react-query', 'react', 'react-dom']
  }
});
