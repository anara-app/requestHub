/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "rgba(18, 45, 161, 1)",
        lightPrimary: "rgba(45, 12, 226, 1)",
      },
    },
  },
  plugins: [],
};
