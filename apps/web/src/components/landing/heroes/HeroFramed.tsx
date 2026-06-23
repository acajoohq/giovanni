import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { GiovanniMark, HeroCta, HeroGlow, heroRootClass, HeroToolChips, type HeroLayoutProps } from "./heroParts";

/** Centered, with the content seated in a skeuomorphic "device" panel — leans into the brand. */
export function HeroFramed({ locale, onStart, variant = "overlay" }: HeroLayoutProps) {
    const { t } = useTranslation();
    const isOverlay = variant === "overlay";

    return (
        <div className={cn(heroRootClass(isOverlay), "flex flex-col items-center justify-center text-center")}>
            <HeroGlow className="left-1/2 top-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2" />

            <div className="relative flex w-full max-w-lg flex-col items-center rounded-[1.75rem] border border-app-border bg-app-surface/70 px-8 py-10 shadow-skeuo backdrop-blur-md">
                <GiovanniMark />

                <h1 className="mt-7 max-w-[15ch] text-balance font-heading text-[clamp(1.9rem,4.6vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-app-text">
                    {t("home.headline")}
                </h1>

                <p className="mt-4 max-w-[40ch] text-pretty text-[14px] leading-relaxed text-app-text-subtle">{t("home.subhead")}</p>

                <HeroCta className="mt-7" onStart={onStart} />

                <HeroToolChips align="center" className="mt-8" locale={locale} />
            </div>
        </div>
    );
}
