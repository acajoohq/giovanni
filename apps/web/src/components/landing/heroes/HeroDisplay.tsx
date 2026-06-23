import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { HeroCta, HeroEyebrow, HeroGlow, heroRootClass, type HeroLayoutProps } from "./heroParts";

/** Centered, oversized display headline with an eyebrow. No mark, no chips — pure impact. */
export function HeroDisplay({ onStart, variant = "overlay" }: HeroLayoutProps) {
    const { t } = useTranslation();
    const isOverlay = variant === "overlay";

    return (
        <div className={cn(heroRootClass(isOverlay), "flex flex-col items-center justify-center text-center")}>
            <HeroGlow className="left-1/2 top-[44%] size-[42rem] -translate-x-1/2 -translate-y-1/2" />

            <div className="relative flex w-full max-w-2xl flex-col items-center">
                <HeroEyebrow>{t("home.eyebrow")}</HeroEyebrow>

                <h1 className="mt-6 max-w-[14ch] text-balance font-heading text-[clamp(2.6rem,7vw,4.6rem)] font-semibold leading-[1.0] tracking-[-0.035em] text-app-text">
                    {t("home.headline")}
                </h1>

                <p className="mt-5 max-w-[40ch] text-pretty text-[16px] leading-relaxed text-app-text-subtle">{t("home.subhead")}</p>

                <HeroCta className="mt-9" onStart={onStart} />
            </div>
        </div>
    );
}
