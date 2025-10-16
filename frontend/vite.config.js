import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: false, // Disable public folder to avoid dependency on it
  server: {
    proxy: {
      '/api': 'http://localhost:3000' // Cambia el puerto si tu backend usa otro
    }
  }
});
