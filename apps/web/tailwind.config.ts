import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        retro: {
          dark: "#0F111A",       // Deep CRT charcoal/navy
          card: "#191B28",       // Retro terminal card
          border: "#2A2D40",     // Crisp border
          accent: "#FBBF24",     // Arcade gold
          green: "#22C55E",      // Terminal neon green
          purple: "#A855F7",     // Arcade purple
          pink: "#F43F5E",       // Retro magenta
          cyan: "#06B6D4",       // Cyber cyan
          cream: "#FAF5EF",      // Warm paper retro text
          subtext: "#94A3B8"     // Cool slate
        }
      },
      boxShadow: {
        'retro': '4px 4px 0px #000000',
        'retro-sm': '2px 2px 0px #000000',
        'retro-lg': '6px 6px 0px #000000',
        'retro-yellow': '4px 4px 0px #F59E0B',
        'retro-green': '4px 4px 0px #16A34A',
        'retro-pink': '4px 4px 0px #E11D48',
      },
      animation: {
        'wiggle': 'wiggle 0.3s ease-in-out infinite',
        'bounce-short': 'bounce-short 0.4s ease-in-out',
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        'bounce-short': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
