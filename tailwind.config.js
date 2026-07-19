/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        reviewsmart: {
          brand: '#da3723', // red-orange primary accent
          brandHover: '#b52918',
          text: '#1a1a1a', // standard body text
          muted: '#5a5a5a', // caption/subtext
          bgLight: '#f7f7f7', // light gray background for headers/sections
          bgWhite: '#ffffff',
          border: '#e2e2e2',
          accentGreen: '#267746', // green for standard highlights if needed
        }
      },
      fontFamily: {
        serif: ['Georgia', 'ui-serif', 'Georgia, Cambria, "Times New Roman", Times, serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
