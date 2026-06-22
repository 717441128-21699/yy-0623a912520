/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7f8',
          100: '#d9ecee',
          200: '#b3d9dd',
          300: '#84bfc6',
          400: '#509ea7',
          500: '#31828b',
          600: '#236871',
          700: '#1e555c',
          800: '#0F4C5C',
          900: '#0d3e4c',
          950: '#052630',
        },
        accent: {
          50: '#fef4ec',
          100: '#fce5d2',
          200: '#f7c6a4',
          300: '#f2a06b',
          400: '#ec7a38',
          500: '#E36414',
          600: '#d15110',
          700: '#ad3e0f',
          800: '#8a3213',
          900: '#702a14',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe': 'breathe 2s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(15, 76, 92, 0.08), 0 1px 2px rgba(15, 76, 92, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(15, 76, 92, 0.1), 0 8px 10px -6px rgba(15, 76, 92, 0.08)',
      }
    },
  },
  plugins: [],
};
