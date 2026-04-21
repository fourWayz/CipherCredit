/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dde6ff',
          200: '#c4d1ff',
          300: '#9fb2ff',
          400: '#7488fd',
          500: '#5160f8',
          600: '#3a3eed',
          700: '#2f30d1',
          800: '#2829a8',
          900: '#262884',
          950: '#17184d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
