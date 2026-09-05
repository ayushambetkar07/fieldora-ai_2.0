/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#166534', // Deep Agricultural Green #166534
          hover: '#12532a',
          light: '#E8F3EB',
          dark: '#0f3d1f',
        },
        'fresh-green': {
          DEFAULT: '#22C55E', // Fresh Medium Green #22C55E
          hover: '#16a34a',
          light: '#dcfce7',
        },
        'accent-orange': {
          DEFAULT: '#F59E0B', // Accent Orange #F59E0B from reference
          hover: '#d97706',
          light: '#fef3c7',
        },
        accent: {
          DEFAULT: '#22C55E',
          hover: '#16a34a',
          light: '#f0fdf4',
        },
        background: '#F7F8F3', // Warm Off-White #F7F8F3
        card: '#FFFFFF',
        main: '#17211B', // Dark Green / Black #17211B
        secondary: '#647067',
        muted: '#94A09A',
        border: '#E5EAE5',
        warning: {
          DEFAULT: '#F59E0B',
          light: '#fef3c7',
          dark: '#b45309',
        },
        info: {
          DEFAULT: '#2563EB',
          light: '#eff6ff',
          dark: '#1d4ed8',
        },
        error: {
          DEFAULT: '#DC2626',
          light: '#fef2f2',
          dark: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        input: '10px',
        button: '10px',
      },
      boxShadow: {
        card: '0 2px 8px 0 rgba(23, 33, 27, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        hover: '0 8px 24px 0 rgba(23, 33, 27, 0.08), 0 2px 6px 0 rgba(0, 0, 0, 0.04)',
        orange: '0 4px 14px 0 rgba(245, 158, 11, 0.35)',
        primary: '0 4px 14px 0 rgba(22, 101, 52, 0.25)',
      }
    },
  },
  plugins: [],
}
