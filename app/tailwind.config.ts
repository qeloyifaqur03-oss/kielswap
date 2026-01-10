import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#030305',
        accent: '#c42558',
      },
      animation: {
        'slow-float': 'slow-float 20s ease-in-out infinite',
        'slow-float-reverse': 'slow-float-reverse 25s ease-in-out infinite',
      },
      keyframes: {
        'slow-float': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '33%': { transform: 'translateY(-20px) translateX(10px)' },
          '66%': { transform: 'translateY(10px) translateX(-10px)' },
        },
        'slow-float-reverse': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '33%': { transform: 'translateY(20px) translateX(-10px)' },
          '66%': { transform: 'translateY(-10px) translateX(10px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
