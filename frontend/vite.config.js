/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { matovaSeoPlugin } from './vite.seoPlugin.js';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, dirname, '');
  if (env.VITE_PUBLIC_SITE_URL) {
    process.env.VITE_PUBLIC_SITE_URL = env.VITE_PUBLIC_SITE_URL;
  }
  if (env.FRONTEND_URL && !process.env.VITE_PUBLIC_SITE_URL) {
    process.env.VITE_PUBLIC_SITE_URL = env.FRONTEND_URL;
  }

  return {
    plugins: [react(), matovaSeoPlugin()],
    server: {
      proxy: {
        '/api': 'http://localhost:8000',
        '/uploads': 'http://localhost:8000',
        '/ready': 'http://localhost:8000',
        '/health': 'http://localhost:8000',
      },
    },
    test: {
      include: ['src/**/*.test.{js,jsx,ts,tsx}', 'src/**/*.spec.{js,jsx,ts,tsx}'],
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.js'],
    },
  };
});
