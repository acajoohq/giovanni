import { cn } from "@/lib/utils";

/** The Giovanni "G" brand mark — mirrors public/favicon.svg. */
export function GiovanniMark({ className }: { className?: string }) {
    return (
        <span className={cn("inline-flex size-14 items-center justify-center rounded-[1.125rem] shadow-skeuo", className)} style={{ background: "#1d1a16" }}>
            <svg aria-label="Giovanni" className="size-9" role="img" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M34 11c-11.05 0-20 8.95-20 20s8.95 20 20 20c4.96 0 9.52-1.81 13.02-4.82V29.5H33v8h5.92v4.08A12.04 12.04 0 0 1 34 42.66c-6.44 0-11.66-5.22-11.66-11.66S27.56 19.34 34 19.34c3.31 0 6.3 1.38 8.42 3.6l5.88-5.88A19.93 19.93 0 0 0 34 11Z"
                    fill="#f7efe2"
                />
            </svg>
        </span>
    );
}
