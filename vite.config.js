import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-firestore', test: /node_modules[\\/](@firebase[\\/]firestore|firebase[\\/]firestore)[\\/]/ },
            { name: 'vendor-firebase', test: /node_modules[\\/](@firebase|firebase)[\\/]/ },
            { name: 'vendor-charts', test: /node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor|decimal\.js-light|internmap|eventemitter3|immer|reselect|redux|react-redux|@reduxjs)[\\/]/ },
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
})
