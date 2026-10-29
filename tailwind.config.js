/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        calm: {
          50: '#f9f9f7',
          100: '#f3f2ee',
          200: '#e6e4dc',
          300: '#d2cebf',
          400: '#a8a28e',
          500: '#7c7664',
          600: '#615c4d',
          700: '#4c483c',
          800: '#2b2923',
          900: '#1a1915',
          950: '#11100e',
        },
        sage: {
          50: '#f4f6f4',
          100: '#e5eae5',
          200: '#cdd7ce',
          300: '#a7bbaa',
          400: '#7e9a83',
          500: '#5e7d64',
          600: '#49634e',
          700: '#3a4e3e',
          800: '#263429',
          900: '#1b241d',
          950: '#111712',
        },
        sand: {
          50: '#faf8f5',
          100: '#f4ede4',
          200: '#e8dcce',
          300: '#d7c4af',
          400: '#bfa48a',
          500: '#a2856a',
          600: '#836a53',
          700: '#665241',
          800: '#403328',
          900: '#2b221a',
          950: '#1a1410',
        },
        slatecalm: {
          50: '#f6f7f8',
          100: '#ebedf0',
          200: '#d8dce2',
          300: '#bac2cc',
          400: '#949fb1',
          500: '#6f7b8f',
          600: '#556073',
          700: '#434b5c',
          800: '#252933',
          900: '#16191f',
          950: '#0e1014',
        },
        dusk: {
          50: '#f7f6f9',
          100: '#eeeaf2',
          200: '#ded7e5',
          300: '#c5b8d2',
          400: '#a593bb',
          500: '#8672a0',
          600: '#6b5883',
          700: '#544467',
          800: '#2e2439',
          900: '#1d1724',
          950: '#120e17',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.04)', opacity: '1' },
        },
        gentlePulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        }
      },
      animation: {
        breathe: 'breathe 8s ease-in-out infinite',
        gentlePulse: 'gentlePulse 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
