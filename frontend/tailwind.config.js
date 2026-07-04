/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff8e1", // Naranja claro/crema
          100: "#ffecb3", // Naranja pálido
          200: "#ffe082", // Naranja medio-claro
          500: "#ff9800", // Naranja vibrante
          600: "#f57c00", // Naranja más profundo
          700: "#ef6c00", // Naranja más oscuro/marrón
          900: "#e65100", // Naranja muy oscuro
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
