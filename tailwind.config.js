/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // Make sure to include this for Vite to process the HTML file
    "./src/**/*.{js,jsx,ts,tsx}", // All JS/JSX/TS/TSX files in the src folder
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
