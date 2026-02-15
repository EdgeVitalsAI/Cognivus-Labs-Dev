/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5b6ee1',
          dark: '#4a5bc7',
          light: '#7b8ce8',
        },
        background: {
          dark: '#0a0e1a',
          card: '#141a2e',
          input: '#1a2138',
        },
        text: {
          primary: '#ffffff',
          secondary: '#8892b0',
          muted: '#5a6380',
        },
        accent: {
          blue: '#4fc3f7',
          red: '#ef5350',
          orange: '#ffb74d',
          green: '#66bb6a',
        },
        vital: {
          spo2: '#29b6f6',
          pulse: '#ef5350',
          temp: '#ffb74d',
          bp: '#ab47bc',
        },
      },
      borderRadius: {
        'xl': '16px',
        'lg': '12px',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 3s infinite',
        'fade-in': 'fadeIn 0.3s ease',
        'fade-in-up': 'fadeInUp 0.8s ease',
        'slide-up': 'slideUp 0.3s ease',
        'slide-down': 'slideDown 0.3s ease',
        'rotate': 'rotate 1s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%) rotate(45deg)' },
          '100%': { transform: 'translateX(100%) rotate(45deg)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        slideDown: {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
        rotate: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};
