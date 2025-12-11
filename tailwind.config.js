/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable dark mode via class strategy
    theme: {
        extend: {
            colors: {
                fifa: {
                    blue: '#002F6C',    // Example deep blue
                    red: '#BA0C2F',     // Example vibrant red
                    gold: '#C6A87C',    // Example gold
                    black: '#1f1f1f',   // Dark background
                    light: '#f8f9fa',   // Light background
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
