import { useState } from "react";

export function useLocalStorage(key: string | undefined, defaultValue: boolean): [boolean, (value: boolean | ((current: boolean) => boolean)) => void] {
    const [state, setState] = useState<boolean>(() => {
        if (!key) return defaultValue;
        try {
            const stored = localStorage.getItem(key);
            return stored !== null ? stored === "true" : defaultValue;
        } catch {
            return defaultValue;
        }
    });

    const setValue = (value: boolean | ((current: boolean) => boolean)) => {
        setState((current) => {
            const next = typeof value === "function" ? value(current) : value;
            if (key) {
                try {
                    localStorage.setItem(key, String(next));
                } catch {
                    // ignore (private browsing, storage full, etc.)
                }
            }
            return next;
        });
    };

    return [state, setValue];
}
