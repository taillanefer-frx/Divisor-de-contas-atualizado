import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          canvas: 'hsl(var(--color-canvas) / <alpha-value>)',
          panel: 'hsl(var(--color-panel) / <alpha-value>)',
          muted: 'hsl(var(--color-muted) / <alpha-value>)',
          border: 'hsl(var(--color-border) / <alpha-value>)',
        },
        ink: {
          strong: 'hsl(var(--color-ink-strong) / <alpha-value>)',
          body: 'hsl(var(--color-ink-body) / <alpha-value>)',
          muted: 'hsl(var(--color-ink-muted) / <alpha-value>)',
          inverse: 'hsl(var(--color-ink-inverse) / <alpha-value>)',
        },
        brand: {
          green: 'hsl(var(--color-green) / <alpha-value>)',
          blue: 'hsl(var(--color-blue) / <alpha-value>)',
          red: 'hsl(var(--color-red) / <alpha-value>)',
          purple: 'hsl(var(--color-purple) / <alpha-value>)',
        },
      },
      boxShadow: {
        soft: '0 14px 40px rgb(38 45 52 / 0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
