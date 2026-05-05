import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ai': path.resolve(frontendRoot, '../ai/src'),
    },
  },
  server: {
    /**
     * Dev proxy:
     * - 프론트(5173)에서 /api/* 호출 시 백엔드(3001)로 전달
     * - Network 탭에는 5173으로 보일 수 있지만, 실제 응답은 백엔드에서 옴(JSON)
     */
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
