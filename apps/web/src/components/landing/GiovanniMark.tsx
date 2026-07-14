import { cn } from "@/lib/utils";

/** The Giovanni brand mark - mirrors public/favicon.svg. */
export function GiovanniMark({ className }: { className?: string }) {
    return (
        <span className={cn("inline-flex items-center justify-center", className)}>
            <img src="./favicon.svg" className="size-18" alt="Giovanni Logo" />
        </span>
    );
}
