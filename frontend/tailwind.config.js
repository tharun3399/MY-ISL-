module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#f0f4ff',
          100: '#e5e7fb',
          600: '#6c47ff',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          600: '#4b5563',
          900: '#111827',
        },
        green: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        }
      },
      scale: {
        '105': '1.05',
      }
    },
  },
  plugins: [],
}
