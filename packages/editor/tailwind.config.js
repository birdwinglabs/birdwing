/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.tsx'],
  theme: {
    screens: {
      'md': { max: 'calc(28rem-400px)' },
      'xl': { max: 'calc(36rem-400px)' },
      '2xl': { max: 'calc(42rem-400px)' },
      '3xl': { max: 'calc(48rem-400px)' },
      '4xl': { max: 'calc(56rem-400px)' },
      '5xl': { max: 'calc(62rem-400px)' },
      '6xl': { max: 'calc(68rem-400px)' },
      '7xl': { max: 'calc(80rem-400px)' },
    },
    extend: {},
  },
  plugins: [],
}

