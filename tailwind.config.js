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
          DEFAULT: '#c9a84c',
          bright: '#e0c25c',
        },
        parchment: {
          DEFAULT: '#f5e6c8',
          dark: '#e8d5a8',
          dim: '#c8b890',
        },
        blood: {
          DEFAULT: '#8b1a1a',
          dark: '#6b1414',
        },
        shadow: '#1a1208',
        stone: {
          DEFAULT: '#3d3528',
          light: '#5a4d3a',
        },
        forest: '#2d4a2d',
      },
    },
  },
  plugins: [],
};
