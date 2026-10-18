/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          berry: '#b64a83',
          'berry-hover': '#933a69',
          mauve: '#efd3e4',
          blush: '#f6e3f0',
          cream: '#f6e9df',
          dark: '#2a1a25',
          champagne: '#eec9a3',
          bronze: '#c89b6b',
          'bronze-deep': '#7d4e32',
        },
      },
    },
  },
  plugins: [],
}
