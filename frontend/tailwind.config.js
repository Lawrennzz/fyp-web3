/** @type {import('@tailwindcss/postcss7-compat').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#1f2937',
        accent: '#6366f1',
      },
    },
  },
  plugins: [],
}