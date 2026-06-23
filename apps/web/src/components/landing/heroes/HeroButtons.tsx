import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { GiovanniMark } from "./GiovanniMark";
import { HeroGlow } from "./HeroGlow";
import { HeroToolButtons } from "./HeroToolButtons";
import type { HeroLayoutProps } from "./heroLayout.types";
import { heroRootClass } from "./heroLayout.utils";

/** Centered hero: Giovanni mark, headline, subhead, and a row of tool buttons. */
export function HeroButtons({ locale, onStart, variant = "overlay" }: HeroLayoutProps) {
    const { t } = useTranslation();
    const isOverlay = variant === "overlay";

    return (
        <div className={cn(heroRootClass(isOverlay), "flex flex-col items-center justify-center text-center")}>
            <HeroGlow className="left-1/2 top-[40%] size-[36rem] -translate-x-1/2 -translate-y-1/2" />

            <div className="relative flex w-full max-w-xl flex-col items-center">
                <GiovanniMark />

                <h1 className="mt-8 max-w-[15ch] text-balance font-heading text-[clamp(2.1rem,5.4vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-app-text">
                    {t("home.headline")}
                </h1>

                <p className="mt-5 max-w-[42ch] text-pretty text-[15px] leading-relaxed text-app-text-subtle">{t("home.subhead")}</p>

                <HeroToolButtons className="mt-9" locale={locale} onStart={onStart} />
            </div>
        </div>
    );
}
