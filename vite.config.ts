import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build', // Output to 'build' instead of 'dist' to match Vercel CRA preset
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  }
});