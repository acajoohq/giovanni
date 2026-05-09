import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { useTheme } from "@/components/theme-provider";

const CYCLE: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];

const ICONS = {
    light: RiSunLine,
    dark: RiMoonLine,
    system: RiComputerLine,
};

const LABELS = {
    light: "Switch to dark mode",
    dark: "Switch to system mode",
    system: "Switch to light mode",
};

export function ModeToggle() {
    const { theme, setTheme } = useTheme();

    const current = (theme as "light" | "dark" | "system") ?? "light";
    const Icon = ICONS[current];

    const cycle = () => {
        const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
        setTheme(next);
    };

    return (
        <button
            aria-label={LABELS[current]}
            className="relative flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-app-border-subtle hover:text-foreground"
            onClick={cycle}
            type="button"
        >
            <Icon className="size-4" />
        </button>
    );
}
