import { HERO_VARIANTS, type HeroVariantId } from "@/components/landing/heroes";
import { cn } from "@/lib/utils";

/**
 * Temporary dev control to flip between hero layouts and pick one visually.
 * Remove (along with the unused variant components) once a layout is chosen.
 */
export function HeroVariantSwitcher({ value, onChange }: { value: HeroVariantId; onChange: (id: HeroVariantId) => void }) {
    return (
        <div className="fixed bottom-4 left-4 z-[60] flex items-center gap-1 rounded-full border border-app-border bg-app-surface/90 px-1.5 py-1.5 shadow-result-tray backdrop-blur-xl">
            <span className="px-2 text-[10px] font-medium uppercase tracking-[0.12em] text-app-text-subtle">Hero</span>
            {HERO_VARIANTS.map((v) => (
                <button
                    className={cn(
                        "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                        value === v.id ? "bg-brand text-white shadow-skeuo-sm" : "text-app-text-muted hover:text-app-text",
                    )}
                    key={v.id}
                    onClick={() => onChange(v.id)}
                    type="button"
                >
                    {v.label}
                </button>
            ))}
        </div>
    );
}
