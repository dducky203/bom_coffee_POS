/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        coffee: {
          50: "#f9f5f0",
          100: "#f0e6d8",
          200: "#e1ccb1",
          300: "#d1b28a",
          400: "#c29863",
          500: "#b37e3c",
          600: "#8f6530",
          700: "#6b4c24",
          800: "#473218",
          900: "#24190c",
        },
        mint: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
      },
    },
  },
  plugins: [],
};
