/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{svelte,js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0B1D14",
        panel: "#0F261A",
        text: "#E7F2EC",
        accent: "#2ECC71",
        accent2: "#B7E4C7",
        line: "#163224",
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};
