/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        zinc: {
          150: '#ececed',
          350: '#a1a1a9',
          355: '#93939b',
          405: '#7c7c85',
          550: '#52525b',
          650: '#2e2e33',
        },
        indigo: {
          650: '#4f46e5',
          455: '#6366f1',
        },
        amber: {
          405: '#d97706',
        },
      },
    },
  },
  plugins: [],
};
