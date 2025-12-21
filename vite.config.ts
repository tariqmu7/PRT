import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/PRT/',
  build: {
    outDir: 'docs', // This puts the finished website in a folder GitHub can see
  }
})
