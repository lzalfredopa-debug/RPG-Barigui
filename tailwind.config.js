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
          DEFAULT: '#D4B15A',
          bright: '#E3C56F',
        },
        parchment: {
          DEFAULT: '#E7D8BC',
          dark: '#EFE4CF',
          dim: '#E7D8BC',
        },
        blood: {
          DEFAULT: '#8B4A3A',
          dark: '#6F392E',
        },
        ink: '#2C241E',
        shadow: '#231B16',
        stone: {
          DEFAULT: '#4A4032',
          light: '#5F5340',
        },
        // Legacy aliases kept so old components do not break.
        // They now resolve strictly to the official palette.
        forest: '#4A4032',
        khaki: '#5F5340',
      },
    },
  },
  plugins: [],
};
