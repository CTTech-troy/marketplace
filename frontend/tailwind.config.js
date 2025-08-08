/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // border: 'hsl(var(--border))',
        // secondary: 'hsl(var(--secondary))',
        // 'secondary-foreground': 'hsl(var(--secondary-foreground))',
        // Add more custom colors if needed
      },
    },
  },
  plugins: [],
};
