/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        neon: {
          50: "#eef8ff",
          100: "#d8eeff",
          500: "#00c2ff",
          700: "#006ce0",
          900: "#0b1220"
        }
      },
      boxShadow: {
        neon: "0 0 30px rgba(0, 194, 255, 0.25)",
        "glow-cyan": "0 0 20px rgba(0, 194, 255, 0.5)",
        "glow-blue": "0 0 20px rgba(59, 130, 246, 0.5)"
      },
      spacing: {
        '4.5': '1.125rem',
        '7.5': '1.875rem',
      },
      fontSize: {
        'sm': ['0.875rem', '1.25rem'],
        'base': ['1rem', '1.5rem'],
        'lg': ['1.125rem', '1.75rem'],
        'xl': ['1.25rem', '1.75rem'],
      },
    },
  },
  plugins: [],
}
