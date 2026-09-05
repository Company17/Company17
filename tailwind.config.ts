import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",
        sheet: "#F6F7F5",
        ink: "#1B2A41",
        inkSoft: "#4A5568",
        rule: "#D9DDE3",
        cloud: "#C8322B",
        cloudSoft: "#FBE9E7",
        approve: "#2F7D5B",
        amber: "#B7791F",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
    },
  },
  plugins: [],
};
export default config;
