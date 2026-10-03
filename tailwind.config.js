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
          DEFAULT: '#d29a35',
          bright: '#e1b65f',
        },
        parchment: {
          DEFAULT: '#f5e6c8',
          dark: '#e8d5a8',
          dim: '#c8b890',
        },
        blood: {
          DEFAULT: '#9b3d27',
          dark: '#6f291d',
        },
        shadow: '#11110f',
        stone: {
          DEFAULT: '#302820',
          light: '#514335',
        },
        forest: '#2d4a2d',
      },
    },
  },
  plugins: [],
};
