import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";
import { ToolbarIconButton } from "@/components/layout/ToolbarIconButton";
import type { Theme } from "@/types/theme.types";
import { useTheme } from "@/providers/ThemeProvider";

const CYCLE: Theme[] = ["light", "dark", "system"];

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

    const current: Theme = theme ?? "light";
    const Icon = ICONS[current];

    const cycle = () => {
        const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
        setTheme(next);
    };

    return (
        <ToolbarIconButton aria-label={LABELS[current]} onClick={cycle}>
            <Icon className="size-4" />
        </ToolbarIconButton>
    );
}
