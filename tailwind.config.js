/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        surface: {
          900: '#0D0F12',
          800: '#111318',
          700: '#1C1F27',
          600: '#252831',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out both',
        'slide-up':   'slideUp 0.5s cubic-bezier(.16,1,.3,1) both',
        'slide-in':   'slideIn 0.35s cubic-bezier(.16,1,.3,1) both',
        'shimmer':    'shimmer 1.6s infinite linear',
        'pulse-dot':  'pulseDot 2s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
        'scale-in':   'scaleIn 0.2s cubic-bezier(.16,1,.3,1) both',
        'toast-in':   'toastIn 0.4s cubic-bezier(.16,1,.3,1) both',
        'toast-out':  'toastOut 0.3s ease-in both',
        'spin-slow':  'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn:  { from: { opacity: '0', transform: 'translateX(-10px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        shimmer:  { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        pulseDot: { '0%,100%': { boxShadow: '0 0 0 0 rgba(124,58,237,0.6)' }, '50%': { boxShadow: '0 0 0 5px rgba(124,58,237,0)' } },
        float:    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        scaleIn:  { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        toastIn:  { from: { opacity: '0', transform: 'translateX(100%)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        toastOut: { from: { opacity: '1', transform: 'translateX(0)' }, to: { opacity: '0', transform: 'translateX(100%)' } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}