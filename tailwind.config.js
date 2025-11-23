/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vision UI - Deep Navy & Electric Blue
        navy: {
          50: '#e8eaf2',
          100: '#c4c9e0',
          200: '#9ca5cb',
          300: '#7481b6',
          400: '#5766a6',
          500: '#394b96',
          600: '#33448e',
          700: '#2c3b83',
          800: '#253379',
          900: '#182362',
          950: '#0B1120', // Deep Navy background
        },
        blue: {
          electric: '#0075FF', // Electric Blue accent
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
