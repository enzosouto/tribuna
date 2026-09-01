import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-bebas)", "system-ui", "sans-serif"],
      },
      colors: {
        background: "#000000",
        foreground: "#FAFAFA",
        border: "#262626",
        input: "#1F1F1F",
        ring: "#C6FF3D",
        primary: {
          DEFAULT: "#C6FF3D",
          foreground: "#08110A",
        },
        secondary: {
          DEFAULT: "#171717",
          foreground: "#FAFAFA",
        },
        muted: {
          DEFAULT: "#141414",
          foreground: "#9A9A9A",
        },
        accent: {
          DEFAULT: "#1F1F1F",
          foreground: "#FAFAFA",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FAFAFA",
        },
        card: {
          DEFAULT: "#0D0D0D",
          foreground: "#FAFAFA",
        },
        popover: {
          DEFAULT: "#141414",
          foreground: "#FAFAFA",
        },
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
