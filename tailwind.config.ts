import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--bg))",
                foreground: "hsl(var(--text))",
                surface: "hsl(var(--surface))",
                "surface-sunk": "hsl(var(--surface-sunk))",
                primary: "hsl(var(--primary))",
                success: "hsl(var(--success))",
                tertiary: "hsl(var(--tertiary))",
                danger: "hsl(var(--danger))",
                muted: "hsl(var(--text-muted))",
                faint: "hsl(var(--text-faint))",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;
