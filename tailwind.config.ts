import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{astro,ts,tsx}'],
  theme: {
    colors: {
      // Neutral palette
      'black': '#000000',
      'white': '#ffffff',
      'gray': {
        '50': '#f9f9f9',
        '100': '#f5f5f5',
        '200': '#efefef',
        '300': '#d9d9d9',
        '400': '#a6a6a6',
        '500': '#777777',
        '600': '#666666',
        '700': '#555555',
        '800': '#333333',
        '900': '#1a1a1a',
      },
      // Brand colours — deep red. `primary-600` is the base used for filled
      // buttons and links; it holds 8.2:1 against the light surface, so it
      // clears WCAG AA for body text as well as large text.
      'primary': {
        '50': '#fdf5f4',
        '100': '#f8e7e6',
        '200': '#efc9c9',
        '300': '#e0a3a5',
        '400': '#c56b71',
        '500': '#a5404b',
        '600': '#8a2f3c',
        '700': '#6f2531',
        '800': '#551c26',
        '900': '#3c141b',
      },
      // Status colors (used as needed)
      'success': '#2d5f2e',
      'warning': '#d97706',
      'error': '#dc2626',
      'info': '#0284c7',
      // Inherit
      'current': 'currentColor',
      'transparent': 'transparent',
    },
    fontFamily: {
      // Serif for headings
      serif: [
        'Georgia',
        'Garamond',
        'ui-serif',
        'serif',
      ],
      // Sans-serif for body
      sans: [
        'system-ui',
        '-apple-system',
        'sans-serif',
      ],
    },
    fontSize: {
      // Scale based on 1.125rem (18px) body
      'xs': ['0.75rem', { lineHeight: '1rem' }],
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],
      'base': ['1.125rem', { lineHeight: '1.75rem' }],
      'lg': ['1.25rem', { lineHeight: '1.75rem' }],
      'xl': ['1.5rem', { lineHeight: '2rem' }],
      '2xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '3xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '4xl': ['3rem', { lineHeight: '3.5rem' }],
      '5xl': ['3.75rem', { lineHeight: '1' }],
      '6xl': ['4.5rem', { lineHeight: '1' }],
    },
    lineHeight: {
      'tight': '1.2',
      'normal': '1.6',
      'relaxed': '1.8',
    },
    spacing: {
      '0': '0',
      '1': '0.25rem',
      '2': '0.5rem',
      '3': '0.75rem',
      '4': '1rem',
      '5': '1.25rem',
      '6': '1.5rem',
      '7': '1.75rem',
      '8': '2rem',
      '10': '2.5rem',
      '12': '3rem',
      '14': '3.5rem',
      '16': '4rem',
      '20': '5rem',
      '24': '6rem',
      '28': '7rem',
      '32': '8rem',
    },
    borderRadius: {
      'none': '0',
      'sm': '0.125rem',
      'base': '0.25rem',
      'md': '0.375rem',
      'lg': '0.5rem',
      'xl': '0.75rem',
      '2xl': '1rem',
      'full': '9999px',
    },
    boxShadow: {
      'none': 'none',
      'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      'base': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
    extend: {
      minHeight: {
        '48px': '48px',
      },
      minWidth: {
        '48px': '48px',
      },
      maxWidth: {
        'container': '1200px',
      },
    },
  },
  plugins: [],
} satisfies Config;
