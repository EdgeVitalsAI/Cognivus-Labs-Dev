import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Admin panel specific config - runs on different port
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'admin-html',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '/index.html') {
            req.url = '/index-admin.html'
          }
          next()
        })
      }
    }
  ],
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
