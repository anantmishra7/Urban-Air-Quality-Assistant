/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0b1120',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
        },
        aqi: {
          good: '#10b981',       // 0-50 Green
          satisfactory: '#84cc16', // 51-100 Light green
          moderate: '#eab308',   // 101-200 Yellow
          poor: '#f97316',       // 201-300 Orange
          verypoor: '#ef4444',   // 301-400 Red
          severe: '#7f1d1d',     // 401-500 Maroon / Dark red
        }
      },
    },
  },
  plugins: [],
}
