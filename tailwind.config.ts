import type { Config } from 'tailwindcss';

const config: Config = {
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
          muted: '#6B7280',
          line: '#E5E7EB'
        }
      },
      boxShadow: {
        soft: '0 8px 24px rgba(17, 24, 39, 0.06)',
        card: '0 10px 28px rgba(17, 24, 39, 0.07)',
        glow: '0 16px 32px rgba(201, 0, 19, 0.12)'
      }
    }
  },
  plugins: []
};

export default config;
