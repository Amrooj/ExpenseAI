/** @type {import('tailwindcss').Config} */
export default {
  // ============================================================
  // content: Tell Tailwind which files to scan for class names.
  //
  // 🎓 TEACHING: Tailwind CSS works by:
  //   1. Scanning your source files for CSS class names
  //   2. Generating ONLY the CSS for classes you actually use
  //   3. Resulting in a tiny CSS bundle (often <10KB)
  //
  // Without this, Tailwind would generate ALL possible utility
  // classes (~3MB of CSS). The content array tells it where to look.
  // ============================================================
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  // ── Dark Mode ─────────────────────────────────────────────
  // "class" strategy: Dark mode is toggled by adding the "dark"
  // class to the <html> element. Your code controls when dark
  // mode is active (vs "media" which uses OS preference only).
  darkMode: "class",

  theme: {
    extend: {
      // ── Custom Color Palette ───────────────────────────────
      // We extend Tailwind's colors with our brand palette.
      // Using HSL values makes it easy to create shades.
      colors: {
        // Primary brand color — Indigo/Violet spectrum
        primary: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",  // Main brand color
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        // Success green
        success: {
          50:  "#f0fdf4",
          500: "#22c55e",
          600: "#16a34a",
          900: "#14532d",
        },
        // Danger red
        danger: {
          50:  "#fff1f2",
          500: "#ef4444",
          600: "#dc2626",
          900: "#7f1d1d",
        },
        // Warning amber
        warning: {
          50:  "#fffbeb",
          500: "#f59e0b",
          600: "#d97706",
          900: "#78350f",
        },
        // Dark mode background colors
        dark: {
          bg:        "#0f0f1a",   // Page background
          surface:   "#1a1a2e",   // Card/panel background
          elevated:  "#16213e",   // Elevated elements
          border:    "#2d2d4a",   // Borders and dividers
          muted:     "#6b7280",   // Muted/secondary text
        },
      },

      // ── Typography ────────────────────────────────────────
      fontFamily: {
        // Inter: Google's beautiful, readable sans-serif
        // Used by Linear, Vercel, Notion, and many modern apps
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },

      // ── Custom Box Shadows ────────────────────────────────
      boxShadow: {
        "glow-primary": "0 0 20px rgba(99, 102, 241, 0.3)",
        "glow-success": "0 0 20px rgba(34, 197, 94, 0.3)",
        "glow-danger":  "0 0 20px rgba(239, 68, 68, 0.3)",
        "card": "0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.2)",
        "card-hover": "0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -4px rgba(0,0,0,0.3)",
      },

      // ── Custom Animations ─────────────────────────────────
      animation: {
        "fade-in":     "fadeIn 0.3s ease-in-out",
        "slide-up":    "slideUp 0.3s ease-out",
        "slide-down":  "slideDown 0.3s ease-out",
        "scale-in":    "scaleIn 0.2s ease-out",
        "spin-slow":   "spin 3s linear infinite",
        "pulse-slow":  "pulse 3s ease-in-out infinite",
        "shimmer":     "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        slideDown: {
          "0%":   { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)",     opacity: "1" },
        },
        scaleIn: {
          "0%":   { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)",    opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },

      // ── Border Radius ─────────────────────────────────────
      borderRadius: {
        "xl":  "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },

      // ── Backdrop Blur ─────────────────────────────────────
      // Used for glassmorphism effects
      backdropBlur: {
        xs: "2px",
      },
    },
  },

  plugins: [
    // Add Tailwind plugins here in later milestones:
    // require("@tailwindcss/forms"),      // Better form styling
    // require("@tailwindcss/typography"), // Prose styling for markdown
  ],
};
