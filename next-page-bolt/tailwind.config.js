/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#234567',
        accent: '#89ABCD',
        brand: {
          orange: '#ff7d4d',
          brown: '#2c1810',
          sand: '#e6d5c9',
          cream: '#fdf6f0',
          white: '#ffffff'
        }
      },
      fontFamily: {
        display: ['Roboto', 'sans-serif'],
        body: ['Open Sans', 'sans-serif'],
      },
      maxWidth: {
        container: '1200px'
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem'
      }
    },
  },
  plugins: [],
};