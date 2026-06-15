import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0d0d0f',
          2: '#141416',
          3: '#1a1a1e',
          4: '#222228',
        },
        border: {
          DEFAULT: '#2a2a32',
          2: '#35353f',
        },
        text: {
          DEFAULT: '#e8e8f0',
          2: '#9090a8',
          3: '#5a5a70',
        },
        purple: {
          DEFAULT: '#7c6ff7',
          2: '#5a54c4',
          bg: '#1e1c3a',
        },
        accent: {
          green: '#3dd68c',
          'green-bg': '#0d2a1e',
          red: '#f06a6a',
          'red-bg': '#2a1010',
          amber: '#f0a840',
          'amber-bg': '#2a1e08',
          blue: '#60a8f0',
          'blue-bg': '#0e1e30',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
}

export default config
