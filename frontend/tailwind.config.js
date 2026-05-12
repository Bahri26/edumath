/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /** Ana marka / birincil aksiyonlar (önceki indigo kullanımıyla aynı tonlar) */
        brand: colors.indigo,
        /** Nötr yüzeyler ve metinler (önceki slate ile aynı) */
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
        card: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-dark': '0 1px 3px 0 rgb(0 0 0 / 0.35)',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
