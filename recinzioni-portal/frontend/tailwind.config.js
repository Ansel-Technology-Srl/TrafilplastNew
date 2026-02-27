/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f4', 100: '#fbe8ec', 200: '#f7cdd4', 300: '#f1a3b1',
          400: '#e86b82', 500: '#dc3d58', 600: '#c41230', 700: '#a40e28',
          800: '#8a0f25', 900: '#761224'
        },
        success: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d'
        }
      }
    }
  },
  plugins: []
}
