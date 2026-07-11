/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /** Ana marka / birincil aksiyonlar (öğretmen & formlar) */
        brand: colors.teal,
        /** Nötr yüzeyler ve metinler */
        surface: colors.slate,
        /** Öğrenci “macera” arka planı ve vurgu gradyanları */
        kid: {
          canvasFrom: colors.amber[50],
          canvasVia: colors.sky[50],
          canvasTo: colors.teal[50],
          canvasFromDark: colors.slate[900],
          canvasViaDark: colors.slate[900],
          canvasToDark: colors.slate[950],
          rail: colors.sky[200],
          titleFrom: colors.amber[500],
          titleVia: colors.sky[500],
          titleTo: colors.teal[500],
          headerFrom: colors.amber[600],
          headerTo: colors.teal[600],
          headerFromDark: colors.amber[400],
          headerToDark: colors.teal[400],
        },
      },
      borderRadius: {
        btn: '0.75rem',
        card: '1.25rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-dark': '0 1px 3px 0 rgb(0 0 0 / 0.35)',
        soft: '0 10px 40px -18px rgb(15 23 42 / 0.18)',
      },
      fontFamily: {
        sans: [
          'Lexend',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'sans-serif',
        ],
        display: [
          'Fraunces',
          'ui-serif',
          'Georgia',
          'serif',
        ],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.45s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'bounce-slow': 'bounceSlow 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
