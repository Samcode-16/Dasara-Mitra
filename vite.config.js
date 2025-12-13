const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

module.exports = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }
          if (id.includes('react')) {
            return 'vendor-react';
          }
          if (id.includes('leaflet')) {
            return 'vendor-leaflet';
          }
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          return 'vendor-misc';
        },
      },
    },
  },
});
