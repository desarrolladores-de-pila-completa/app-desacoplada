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
      '/api': 'http://localhost:3000' // Cambia el puerto si tu backend usa otro
    }
  }
});
