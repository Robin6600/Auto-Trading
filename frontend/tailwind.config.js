/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
            black: '#000000',
            neonGreen: '#39FF14',
            neonRed: '#FF3131',
            cyan: '#00FFFF',
            darkNavy: '#0a0a1a', // Custom deep navy for gradient
        }
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'], // Fallback for hacker vibes
      },
      boxShadow: {
        'neon-green': '0 0 10px #39FF14, 0 0 20px #39FF14',
        'neon-blue': '0 0 10px #00FFFF, 0 0 20px #00FFFF',
      }
    },
  },
  plugins: [],
}
