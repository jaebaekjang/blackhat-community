import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 검은 모자 라디오국 다크 테마 팔레트
        ink: {
          DEFAULT: "#08080a", // 가장 어두운 배경
          900: "#0c0c0f",
          800: "#121215",
          700: "#17171b",
        },
        surface: {
          DEFAULT: "#161619", // 카드 배경
          alt: "#1d1d22",
          hover: "#23232a",
        },
        line: {
          DEFAULT: "#2a2a31", // 경계선
          strong: "#3a3a44",
        },
        blood: {
          DEFAULT: "#c81e2c", // 붉은 포인트
          dim: "#8f1620",
          bright: "#ef3a4a",
          glow: "rgba(200,30,44,0.18)",
        },
        ash: {
          DEFAULT: "#b9b9c2", // 본문 텍스트
          dim: "#7d7d88",
          faint: "#54545d",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.02), 0 8px 24px rgba(0,0,0,0.5)",
        glow: "0 0 0 1px rgba(200,30,44,0.4), 0 0 24px rgba(200,30,44,0.15)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "92%": { opacity: "1" },
          "94%": { opacity: "0.4" },
          "96%": { opacity: "1" },
          "98%": { opacity: "0.7" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        flicker: "flicker 6s infinite",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
