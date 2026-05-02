import { clsx } from "clsx";
import { motion } from "motion/react";
import { type KeyboardEvent, useRef } from "react";

export type Tool = {
    readonly id: string;
    readonly label: string;
    readonly shortLabel: string;
    readonly color: string;
    readonly title: string;
    readonly helper: string;
};

type ToolTabListProps = {
    tools: readonly Tool[];
    activeToolId: string;
    onToolChange: (id: string) => void;
};

export function ToolTabList({ tools, activeToolId, onToolChange }: ToolTabListProps) {
    const tabRefs = useRef(new Map<string, HTMLButtonElement>());

    function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, toolId: string) {
        const currentIndex = tools.findIndex((t) => t.id === toolId);
        let nextId: string | undefined;

        if (event.key === "ArrowLeft") nextId = tools[(currentIndex - 1 + tools.length) % tools.length]?.id;
        else if (event.key === "ArrowRight") nextId = tools[(currentIndex + 1) % tools.length]?.id;
        else if (event.key === "Home") nextId = tools[0]?.id;
        else if (event.key === "End") nextId = tools[tools.length - 1]?.id;

        if (nextId !== undefined) {
            event.preventDefault();
            onToolChange(nextId);
            tabRefs.current.get(nextId)?.focus();
        }
    }

    return (
        <div className="relative z-20 overflow-x-auto px-5 pt-1">
            <ul aria-label="PDF tools" aria-orientation="horizontal" className="m-0 flex min-w-max list-none items-end gap-1 p-0 pl-1" role="tablist">
                {tools.map((tool) => {
                    const isActive = tool.id === activeToolId;
                    return (
                        <li className="contents" key={tool.id}>
                            <motion.button
                                ref={(el) => {
                                    if (el) tabRefs.current.set(tool.id, el);
                                    else tabRefs.current.delete(tool.id);
                                }}
                                animate={{ y: isActive ? 1 : 10 }}
                                aria-controls="tool-folder-panel"
                                aria-selected={isActive}
                                className={clsx(
                                    "relative flex min-h-[4.25rem] min-w-36 flex-col items-start justify-end gap-1 rounded-t-[12px] border border-b-0 border-stone-950 px-4 pb-3.5 pt-4 text-left focus-visible:z-30 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[#008fbe] sm:min-w-44 sm:px-5",
                                    tool.color,
                                    isActive
                                        ? "z-20 shadow-[5px_0_0_rgba(28,25,23,0.16)] after:absolute after:inset-x-0 after:-bottom-2 after:h-3 after:rounded-b-[12px] after:bg-inherit"
                                        : "z-0 shadow-[3px_0_0_rgba(28,25,23,0.09)]",
                                )}
                                id={`tool-tab-${tool.id}`}
                                onClick={() => onToolChange(tool.id)}
                                onKeyDown={(e) => handleTabKeyDown(e, tool.id)}
                                role="tab"
                                tabIndex={isActive ? 0 : -1}
                                transition={{ type: "spring", stiffness: 500, damping: 36, mass: 0.75 }}
                                type="button"
                                whileHover={!isActive ? { y: 5 } : undefined}
                            >
                                <span className="text-[10px] font-black uppercase leading-none tracking-widest text-stone-500 sm:text-[11px]">{tool.shortLabel}</span>
                                <span className="text-[0.875rem] font-black leading-tight text-stone-950 sm:text-[0.95rem]">{tool.label}</span>
                            </motion.button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
