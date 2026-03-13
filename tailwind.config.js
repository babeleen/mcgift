/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#FAF7F2", card: "#FFFFFF", accent: "#D4602C", "accent-light": "#F2E0D4",
          green: "#2D8659", "green-light": "#E3F2EA", yellow: "#B8860B", "yellow-light": "#FFF8E7",
          text: "#2C2416", muted: "#8C7E6A", border: "#E8E0D4",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Instrument Sans", "SF Pro Display", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
