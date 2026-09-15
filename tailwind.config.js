/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        ink: '#0d0d0f',
        deep: '#161618',
        dusk: '#222226',
        steel: '#3a3a40',
        mist: '#888896',
        snow: '#e8e8f0',
        glow: '#c9873f',
      },
    },
  },
  plugins: [],
};
