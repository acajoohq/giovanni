import { createContext, use, useEffect, useState } from "react";
import { ScriptOnce } from "@tanstack/react-router";
import type { Theme } from "@/types/theme.types";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

type ThemeScriptParam = { storageKey: string; defaultTheme: string };

function FunctionOnce<T>({ fn, param }: { fn: (param: NoInfer<T>) => void; param: T }) {
    return <ScriptOnce>{`(${fn.toString()})(${JSON.stringify(param)})`}</ScriptOnce>;
}

function initThemeScript({ storageKey, defaultTheme }: ThemeScriptParam) {
    try {
        const stored = localStorage.getItem(storageKey);
        const theme = stored === "light" || stored === "dark" || stored === "system" ? stored : defaultTheme;
        const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const resolved = theme === "system" ? (dark ? "dark" : "light") : theme;
        document.documentElement.classList.add(resolved);
        document.documentElement.style.colorScheme = resolved;
    } catch {}
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    const resolved = theme === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
}

function readStoredTheme(storageKey: string, defaultTheme: Theme): Theme {
    try {
        const stored = localStorage.getItem(storageKey);
        return stored === "light" || stored === "dark" || stored === "system" ? stored : defaultTheme;
    } catch {
        return defaultTheme;
    }
}

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "theme" }: ThemeProviderProps) {
    // keep the first client render aligned with SSR; initThemeScript already applies the stored theme to <html>
    const [theme, setThemeState] = useState<Theme>(defaultTheme);

    useEffect(() => {
        setThemeState(readStoredTheme(storageKey, defaultTheme));
    }, [defaultTheme, storageKey]);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        if (theme !== "system") return;
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => applyTheme("system");
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, [theme]);

    const setTheme = (next: Theme) => {
        localStorage.setItem(storageKey, next);
        setThemeState(next);
    };

    return (
        <ThemeProviderContext value={{ theme, setTheme }}>
            <FunctionOnce fn={initThemeScript} param={{ storageKey, defaultTheme }} />
            {children}
        </ThemeProviderContext>
    );
}

export function useTheme() {
    const context = use(ThemeProviderContext);
    if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
}
