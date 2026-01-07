import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'slide-right': {
          '0%': { transform: 'translateX(0)' }, 
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'slide-right': 'slide-right 3s linear infinite',
        
      },
    },
  },


  plugins: [react(),tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})