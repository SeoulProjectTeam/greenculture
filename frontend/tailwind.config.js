/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        seoul: {
          sky: '#E8F4FC',
          blue: '#1E88E5',
          navy: '#0D47A1',
          coral: '#FF6B6B',
          mint: '#26C6DA',
        },
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 40px -12px rgba(13, 71, 161, 0.15)',
      },
    },
  },
  plugins: [],
};
