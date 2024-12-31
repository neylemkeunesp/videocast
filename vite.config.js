import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '^/api/v1/.*': {
        target: 'https://mercury.dev.dream-ai.com',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx']
  },
  esbuild: {
    loader: 'jsx',
    include: /\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.mjs': 'jsx'
      }
    }
  }
});
