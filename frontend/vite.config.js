import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react()
  ],
  publicDir: false, // Disable public folder to avoid dependency on it
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true // Habilitar WebSocket proxy
      }
    },
    hmr: {
        // Vite automáticamente encontrará un puerto disponible
        host: 'localhost'
      }
  },
  build: {
    // Optimizaciones avanzadas de build
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,

    // Configuración de chunks para mejor caching
    rollupOptions: {
      output: {
        // Manual chunks para separar vendor libraries
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],
          'ui-vendor': ['@headlessui/react', 'lucide-react', 'clsx'],
          'query-vendor': ['@tanstack/react-query'],
          'form-vendor': ['react-hook-form', 'zod'],
          'utils-vendor': ['axios', 'date-fns', 'lodash']
        },

        // Estrategia de nombres para chunks
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.jsx', '').replace('.js', '')
            : 'chunk';
          return `assets/js/${facadeModuleId}-[hash].js`;
        },

        // Estrategia de nombres para assets
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },

        // Optimizar nombres de entrada
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },

    // Límites de tamaño para optimización
    chunkSizeWarningLimit: 1000,

    // Configuración de CSS para mejor separación
    cssCodeSplit: true,

    // Assets inline threshold
    assetsInlineLimit: 4096,

    // Reporte de análisis de bundle
    reportCompressedSize: true
  },

  // Optimizaciones adicionales para desarrollo
  esbuild: {
    // Remover console.log en producción
    drop: ['console', 'debugger']
  },

  // Configuración de dependencias para optimización
  optimizeDeps: {
    include: [
      '@tanstack/react-query',
      'react',
      'react-dom',
      'react-router-dom',
      'axios'
    ],
    exclude: ['@vite/client', '@vite/env']
  },

  // Configuración de preview para producción
  preview: {
    port: 4173,
    host: true
  }
});
