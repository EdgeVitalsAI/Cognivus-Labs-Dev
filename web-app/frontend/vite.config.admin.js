import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Admin panel specific config - runs on different port
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,  // Different port from main app (5173)
    host: true,
    strictPort: true,
  },
  build: {
    outDir: 'dist-admin',
    emptyOutDir: true,
  },
  define: {
    // Point to admin backend
    'process.env.VITE_API_URL': JSON.stringify('http://localhost:8001')
  }
})
