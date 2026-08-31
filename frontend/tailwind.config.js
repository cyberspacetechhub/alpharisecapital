/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1a3a2a",
          accent: "#2d6a4f",
          light: "#f0f7f4",
        },
      },
    },
  },
  plugins: [],
};
