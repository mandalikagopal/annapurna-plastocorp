import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // Forces Windows to use IPv4 instead of IPv6 [::1]
    port: 5173        // Keeps it on the same port you are used to
  }
})