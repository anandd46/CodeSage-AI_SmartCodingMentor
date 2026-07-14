/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand palette
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Accent cyan
        accent: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Dark backgrounds
        dark: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Surface colors
        surface: {
          DEFAULT: '#0f172a',
          card:    '#1e293b',
          border:  '#334155',
          hover:   '#243447',
          input:   '#162032',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease-in-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'slide-in':     'slideIn 0.3s ease-out',
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient':     'gradient 8s ease infinite',
        'float':        'float 6s ease-in-out infinite',
        'glow':         'glow 2s ease-in-out infinite alternate',
        'spin-slow':    'spin 3s linear infinite',
        'bounce-slow':  'bounce 2s infinite',
        'shimmer':      'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 5px rgba(99,102,241,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(99,102,241,0.7), 0 0 40px rgba(99,102,241,0.3)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundSize: {
        '200%': '200% 200%',
        '300%': '300% 300%',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-sm':    '0 0 10px rgba(99,102,241,0.2)',
        'glow':       '0 0 20px rgba(99,102,241,0.3)',
        'glow-lg':    '0 0 40px rgba(99,102,241,0.4)',
        'glow-cyan':  '0 0 20px rgba(6,182,212,0.3)',
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 48px rgba(0,0,0,0.6)',
        'inner-glow': 'inset 0 0 20px rgba(99,102,241,0.1)',
      },
    },
  },
  plugins: [],
};
