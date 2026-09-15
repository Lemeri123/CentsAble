/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        ink: 'var(--color-ink)',
        deep: 'var(--color-deep)',
        dusk: 'var(--color-dusk)',
        steel: 'var(--color-steel)',
        mist: 'var(--color-mist)',
        snow: 'var(--color-snow)',
        glow: 'var(--color-glow)',
      },
    },
  },
  plugins: [],
};
