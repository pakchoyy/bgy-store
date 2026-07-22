/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0ea5a0',
          light: 'rgba(14,165,160,0.08)',
          medium: 'rgba(14,165,160,0.1)',
          dark: '#0d7a8a',
          deep: '#2d6a7f',
        },
        background: 'var(--bg)',
        card: 'var(--card-bg)',
        inputbg: 'var(--input-bg)',
        textprimary: 'var(--text)',
        textlight: 'var(--text-light)',
        border: 'var(--border)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
      boxShadow: {
        card: 'var(--shadow)',
        'card-lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
};
