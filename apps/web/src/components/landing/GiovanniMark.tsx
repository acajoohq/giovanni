import { cn } from "@/lib/utils";
import { GiovanniIcon } from "@/components/theme/GiovanniIcon";

/** The Giovanni brand mark - mirrors public/favicon.svg. */
export function GiovanniMark({ className }: { className?: string }) {
    return (
        <span className={cn("inline-flex items-center justify-center", className)}>
            <GiovanniIcon className="size-18" />
        </span>
    );
}
