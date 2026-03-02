import { heroui } from "@heroui/theme";

export default heroui({
  themes: {
    light: {
      colors: {
        primary: {
          50: "#FDF7FF",
          100: "#F5E6FA",
          200: "#EDC8E0",
          300: "#C87DD4",
          400: "#9B3FB0",
          500: "#7b2c8f",
          600: "#581668",
          700: "#3d0f48",
          800: "#2d0b35",
          900: "#1a0621",
          DEFAULT: "#581668",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#EDC8E0",
          foreground: "#3D0F48",
        },
        focus: "#7b2c8f",
      },
    },
    dark: {
      colors: {
        background: "#1a1028",
        foreground: "#f0e6f6",
        content1: "#251538",
        content2: "#2e1d42",
        content3: "#362448",
        content4: "#3e2c50",
        divider: "rgba(180,150,210,0.15)",
        default: {
          50: "#1a1028",
          100: "#211335",
          200: "#2e1d42",
          300: "#3a264e",
          400: "#4d3566",
          500: "#6b4f85",
          600: "#8a6fa3",
          700: "#a48dba",
          800: "#c4b5d4",
          900: "#f0e6f6",
          DEFAULT: "#2e1d42",
          foreground: "#f0e6f6",
        },
        primary: {
          50: "#1a0621",
          100: "#2d0b35",
          200: "#3d0f48",
          300: "#581668",
          400: "#7b2c8f",
          500: "#9B3FB0",
          600: "#C87DD4",
          700: "#EDC8E0",
          800: "#F5E6FA",
          900: "#FDF7FF",
          DEFAULT: "#c882dc",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#3d0f48",
          foreground: "#EDC8E0",
        },
        focus: "#c882dc",
      },
    },
  },
});
