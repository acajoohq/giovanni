import { clsx } from "clsx";

type DropZoneProps = {
    className?: string;
};

export function DropZone({ className }: DropZoneProps) {
    return (
        <div
            className={clsx(
                "group relative flex min-h-[15rem] cursor-pointer flex-col items-center justify-center gap-5 rounded-[8px] border-2 border-dashed border-stone-300 px-8 py-12 text-center transition-all duration-200 hover:border-stone-400 hover:bg-black/[0.02]",
                className,
            )}
        >
            {/* Upload icon pill */}
            <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-[10px] border border-stone-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.03)] transition-transform duration-200 group-hover:-translate-y-0.5">
                <svg
                    aria-hidden="true"
                    className="size-[22px] text-stone-500"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                >
                    {/* Document */}
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    {/* Up arrow */}
                    <line x1="12" x2="12" y1="12" y2="18" />
                    <polyline points="9 15 12 12 15 15" />
                </svg>
            </div>

            <div className="flex flex-col gap-1.5">
                <p className="text-sm font-black leading-5 text-stone-800">Drop your PDF here</p>
                <p className="text-sm leading-5 text-stone-500">
                    or{" "}
                    <span className="font-bold underline decoration-stone-400 underline-offset-2 transition-colors duration-150 group-hover:decoration-stone-600">
                        click to browse
                    </span>
                </p>
            </div>

            <p className="text-xs font-medium leading-4 text-stone-400">Your files never leave this device</p>
        </div>
    );
}
