"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
    theme: Theme;
    setTheme: (t: Theme) => void;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "dark",
    setTheme: () => {},
    toggle: () => {},
});

const STORAGE_KEY = "velix-theme";

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Default to dark; the inline no-flash script (in layout.tsx) sets the
    // real class before hydration so this initial value never causes a flash.
    const [theme, setThemeState] = useState<Theme>("dark");

    useEffect(() => {
        let stored: Theme | null = null;
        try {
            stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
        } catch {
            /* ignore */
        }
        const initial: Theme =
            stored ??
            (window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark");
        setThemeState(initial);
        applyTheme(initial);
    }, []);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        applyTheme(t);
        try {
            localStorage.setItem(STORAGE_KEY, t);
        } catch {
            /* ignore */
        }
    }, []);

    const toggle = useCallback(() => {
        setTheme(theme === "dark" ? "light" : "dark");
    }, [theme, setTheme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
