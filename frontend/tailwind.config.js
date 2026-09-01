/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#00c076",
          accent: "#00a86b",
          dark: "#052e1c",
          light: "#00e676",
          emerald: "#10b981",
        },
      },
    },
  },
  plugins: [],
};
