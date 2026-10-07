const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        page: v('bg'),
        card: v('card'),
        soft: v('soft'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        key: v('key'),
        'key-ink': v('key-ink'),
        fn: v('fn'),
        'fn-ink': v('fn-ink'),
        op: v('op'),
        'op-hover': v('op-hover'),
        clear: v('clear'),
        'clear-ink': v('clear-ink'),
        sci: v('sci'),
        'sci-ink': v('sci-ink'),
        brand: v('brand'),
        accent: v('accent'),
        danger: v('danger'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        key: '0 1px 0 0 rgb(var(--shadow) / 0.08), 0 6px 12px -8px rgb(var(--shadow) / 0.4)',
        'key-hover': '0 1px 0 0 rgb(var(--shadow) / 0.08), 0 10px 18px -8px rgb(var(--shadow) / 0.5)',
        card: '0 30px 80px -30px rgb(var(--accent) / 0.45), 0 12px 32px -16px rgb(var(--shadow) / 0.35)',
        glow: '0 10px 24px -8px rgb(var(--accent) / 0.6)',
      },
      backgroundImage: {
        equals: 'linear-gradient(135deg, #f0489b 0%, #db2777 55%, #be185d 100%)',
        logo: 'linear-gradient(135deg, #ff5fa8 0%, #db2777 100%)',
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        expand: {
          '0%': { opacity: '0', transform: 'translateY(-8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        'result-pop': {
          '0%': { opacity: '0.3', transform: 'scale(0.9)' },
          '60%': { opacity: '1', transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in': 'slide-in 0.25s ease-out both',
        expand: 'expand 0.25s ease-out both',
        shake: 'shake 0.4s ease-in-out',
        'result-pop': 'result-pop 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};
