/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Violet/Indigo blend matching the sidebar
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        duo: {
          green: '#58cc02', // Duolingo green
          greenHover: '#46a302',
          red: '#ff4b4b',   // Duolingo red
          redHover: '#cc3c3c',
          gold: '#ffc800',  // Coins/XP
        }
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'btn': '0 4px 0 0 rgba(0, 0, 0, 0.1)',
        'btn-green': '0 4px 0 0 #46a302',
        'btn-red': '0 4px 0 0 #cc3c3c',
        'btn-primary': '0 4px 0 0 #5b21b6',
      }
    },
  },
  plugins: [],
}
