import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { GiovanniMark } from "@/components/landing/GiovanniMark";
import { HeroGlow } from "@/components/landing/HeroGlow";
import { cn } from "@/lib/utils";

interface LandingHeroProps {
    variant?: "overlay" | "static";
    children?: ReactNode;
}

/** Marketing hero: brand mark, headline, subhead, and an optional tool nav slot. */
export function LandingHero({ variant = "overlay", children }: LandingHeroProps) {
    const { t } = useTranslation();

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center overflow-hidden px-6 text-center",
                variant === "overlay" ? "absolute inset-0" : "relative min-h-full w-full py-20",
            )}
        >
            <HeroGlow className="left-1/2 top-[40%] size-[36rem] -translate-x-1/2 -translate-y-1/2" />

            <div className="relative flex w-full max-w-xl flex-col items-center">
                <GiovanniMark />

                <h1 className="mt-8 max-w-[15ch] text-balance font-heading text-[clamp(2.1rem,5.4vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-app-text">
                    {t("home.headline")}
                </h1>

                <p className="mt-5 max-w-[42ch] text-pretty text-[15px] leading-relaxed text-app-text-subtle">{t("home.subhead")}</p>

                {children}
            </div>
        </div>
    );
}
