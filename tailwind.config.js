/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          950: '#030705',
          900: '#050c08',
          850: '#08140c',
          800: '#0c1a11',
          700: '#142a1d',
          accent: 'var(--accent-color, #00ff66)',
          'accent-dim': 'rgba(var(--accent-rgb, 0, 255, 102), 0.15)',
          'accent-glow': 'rgba(var(--accent-rgb, 0, 255, 102), 0.4)',
          text: 'var(--text-primary, #e2f7ed)',
          muted: 'var(--text-secondary, #739483)',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
