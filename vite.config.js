import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { include: ['three', 'three/addons/objects/Sky.js'] },
  build: { rollupOptions: { output: { manualChunks: { three: ['three'] } } } },
});
