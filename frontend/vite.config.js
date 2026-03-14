import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('lucide-react') || id.includes('framer-motion')) {
            return 'ui-vendor';
          }

          if (id.includes('recharts')) {
            return 'recharts-vendor';
          }

          if (id.includes('node_modules/d3-') || id.includes('node_modules\\d3-')) {
            return 'd3-vendor';
          }

          if (id.includes('@monaco-editor') || id.includes('monaco-editor')) {
            return 'editor-vendor';
          }

          if (id.includes('jspdf')) {
            return 'pdf-vendor';
          }

          if (id.includes('html2canvas')) {
            return 'capture-vendor';
          }

          if (id.includes('katex') || id.includes('react-katex')) {
            return 'math-vendor';
          }

          if (id.includes('axios') || id.includes('dompurify')) {
            return 'data-vendor';
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy /api requests to backend during development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
