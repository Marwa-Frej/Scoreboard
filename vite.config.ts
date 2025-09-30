import { defineConfig } from 'vite';

export default defineConfig({
  server: { 
    port: 3000,
    host: true,
    open: 'http://localhost:5173'
  },
  build: {
    outDir: 'dist'
  }
});