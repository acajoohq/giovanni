import type { ComponentType } from "react";
import { HeroButtons } from "./HeroButtons";
import { HeroCentered } from "./HeroCentered";
import { HeroDisplay } from "./HeroDisplay";
import { HeroFramed } from "./HeroFramed";
import type { HeroLayoutProps } from "./heroParts";

export type HeroVariantId = "buttons" | "centered" | "display" | "framed";

/** Centered-family hero layouts. Add a new layout here to make it appear in the switcher. */
export const HERO_VARIANTS: { id: HeroVariantId; label: string; Component: ComponentType<HeroLayoutProps> }[] = [
    { id: "buttons", label: "Buttons", Component: HeroButtons },
    { id: "centered", label: "Classic", Component: HeroCentered },
    { id: "display", label: "Display", Component: HeroDisplay },
    { id: "framed", label: "Framed", Component: HeroFramed },
];

export const DEFAULT_HERO_VARIANT: HeroVariantId = "buttons";

export type { HeroLayoutProps };
