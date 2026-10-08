/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        gold: {
          DEFAULT: '#d4b15a',
          bright: '#e3c56f',
        },
        parchment: {
          DEFAULT: '#e7d8bc',
          dark: '#efe4cf',
          dim: '#c9b28a',
        },
        blood: {
          DEFAULT: '#8b4a3a',
          dark: '#6f392e',
        },
        shadow: '#231b16',
        stone: {
          DEFAULT: '#4a4032',
          light: '#5f5340',
        },
        forest: '#2d4a2d',
        khaki: '#9d8e70',
      },
    },
  },
  plugins: [],
};
