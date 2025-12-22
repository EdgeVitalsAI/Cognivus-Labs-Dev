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
          DEFAULT: '#040719',
          50: '#F5F6FA',
          100: '#EBEDF5',
          200: '#D7DBE9',
          300: '#C3C9DD',
          400: '#9BA3C0',
          500: '#6E80E7',
          600: '#040719',
          700: '#03050F',
          800: '#02030A',
          900: '#010105',
        },
        accent: {
          DEFAULT: '#6E80E7',
          50: '#F3F5FE',
          100: '#E7EBFD',
          200: '#C3CCFA',
          300: '#9FADF7',
          400: '#576FF1',
          500: '#6E80E7',
          600: '#4A5FC4',
          700: '#3A4B9C',
          800: '#2A3674',
          900: '#1A214C',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
