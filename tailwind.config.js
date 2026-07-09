/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        primary: {
          50: '#f0f6ff',
          100: '#e0ecff',
          200: '#c1d9ff',
          300: '#a2c6ff',
          400: '#6b9eff',
          500: '#0078d4',
          600: '#0063b1',
          700: '#004a8e',
          800: '#003366',
          900: '#001a33',
        },
        secondary: {
          50: '#f0fffe',
          100: '#e0fffd',
          200: '#b3fffb',
          300: '#80fff9',
          400: '#4dffef',
          500: '#00d4aa',
          600: '#00b896',
          700: '#009c82',
          800: '#00806e',
          900: '#00665a',
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"Fira Code"', '"Courier New"', 'monospace'],
      },
      boxShadow: {
        none: 'none',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        elevation: '0 8px 16px 0 rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
