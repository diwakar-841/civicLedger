export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    screens: {
      xs: "420px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px"
    },
    extend: {
      fontFamily: {
        sans: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "DM Sans", "ui-sans-serif", "sans-serif"]
      },
      colors: {
        ink: "#111827",
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca"
        },
        navy: {
          50: "#eef1f8",
          100: "#d7deef",
          200: "#b0bfdf",
          300: "#8899c9",
          400: "#5c6fac",
          500: "#3d5091",
          600: "#2b3c74",
          700: "#202d59",
          800: "#161f40",
          900: "#0c1428",
          950: "#080d1a"
        },
        gold: {
          50: "#fdf8ec",
          100: "#faedc9",
          200: "#f4da96",
          300: "#eac25e",
          400: "#dfab38",
          500: "#c9922a",
          600: "#a67320",
          700: "#82581c",
          800: "#6b481c",
          900: "#5a3d1c"
        }
      },
      boxShadow: {
        card: "0 1px 2px rgba(12, 20, 40, 0.04), 0 8px 24px -8px rgba(12, 20, 40, 0.12)",
        elevated: "0 12px 32px -12px rgba(12, 20, 40, 0.35)"
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out both",
        "slide-up": "slideUp 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both"
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { "0%": { opacity: "0", transform: "scale(0.96)" }, "100%": { opacity: "1", transform: "scale(1)" } }
      }
    }
  },
  plugins: []
};