import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => ({
  application: {},
  vite: {
    server: {
      proxy: {
        '/api': { changeOrigin: true, target: 'http://localhost:5320', ws: true },
      },
    },
  },
}));
