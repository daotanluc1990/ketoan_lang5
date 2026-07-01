import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        lang: {
          red: '#C90013',
          redDark: '#A50010',
          redDeep: '#7F000C',
          redSoft: '#FFF1F2',
          yellow: '#F6C453',
          yellowSoft: '#FFF7D6',
          cream: '#F7F8FA',
          cream2: '#FAFAFA',
          paper: '#FFFFFF',
          brown: '#161B2A',
          ink: '#111827',
          muted: '#4B5563', // Đậm hơn #6B7280 để đạt contrast AA
          line: '#E5E7EB',
          // Dark mode tokens
          darkBg: '#0F1117',
          darkCard: '#1A1D29',
          darkLine: '#2A2D3A',
          darkInk: '#E5E7EB',
          darkMuted: '#9CA3AF',
        }
      },
      fontSize: {
        // Compact density scale — thay thế !important overrides
        'xs': ['11px', { lineHeight: '1.2rem' }],
        'sm': ['12px', { lineHeight: '1.15rem' }],
        'base': ['13px', { lineHeight: '1.25rem' }],
        'md': ['14px', { lineHeight: '1.3rem' }],
        'lg': ['16px', { lineHeight: '1.3rem' }],
        'xl': ['18px', { lineHeight: '1.35rem' }],
        '2xl': ['22px', { lineHeight: '1.6rem' }],
        '3xl': ['28px', { lineHeight: '1.85rem' }],
        '4xl': ['34px', { lineHeight: '2rem' }],
      },
      spacing: {
        // Compact spacing — thay thế !important overrides
        '3.5': '0.875rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(17, 24, 39, 0.08), 0 1px 2px rgba(17, 24, 39, 0.04)',
        card: '0 4px 12px rgba(17, 24, 39, 0.08)',
        glow: '0 8px 24px rgba(201, 0, 19, 0.12)',
      },
    }
  },
  plugins: []
};

export default config;
