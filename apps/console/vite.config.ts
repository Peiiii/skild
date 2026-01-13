import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig(() => {
  const registryTarget = (process.env.VITE_REGISTRY_URL || 'http://localhost:18787').trim().replace(/\/+$/, '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: registryTarget,
          changeOrigin: true,
          rewrite: p => p.replace(/^\/api/, '')
        }
      }
    }
  };
});
