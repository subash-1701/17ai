export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: { extend: {
    fontFamily: { sans: ["Onest", "ui-sans-serif", "system-ui", "sans-serif"], mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"] },
    colors: { bg: "var(--bg)", panel: "var(--panel)", line: "var(--line)", ink: "var(--ink)", mute: "var(--mute)", accent: "var(--accent)" },
  } },
};
