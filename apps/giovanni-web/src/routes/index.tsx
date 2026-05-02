import { createFileRoute } from "@tanstack/react-router";
import { type KeyboardEvent, useEffect, useState } from "react";
import { createSeoMeta } from "../lib/seo";

const tools = [
    {
        id: "compress",
        label: "Compress PDF",
        shortLabel: "Compress",
        color: "bg-[#fff2a8]",
        title: "Compress PDF",
        helper: "Reduce file size locally.",
    },
    {
        id: "split",
        label: "Split Pages",
        shortLabel: "Split",
        color: "bg-[#ccebdc]",
        title: "Split Pages",
        helper: "Export selected pages.",
    },
    {
        id: "merge",
        label: "Merge PDFs",
        shortLabel: "Merge",
        color: "bg-[#ffd2c8]",
        title: "Merge PDFs",
        helper: "Stack files in order.",
    },
    {
        id: "images",
        label: "Extract Images",
        shortLabel: "Images",
        color: "bg-[#d9dcff]",
        title: "Extract Images",
        helper: "Pull embedded images.",
    },
] as const;

export const Route = createFileRoute("/")({
    head: () => ({
        meta: createSeoMeta({
            title: "Giovanni | Frugal PDF Tools",
            description: "A pastel, local-first PDF workspace for compressing, splitting, merging, and extracting images.",
        }),
    }),
    component: HomePage,
});

function HomePage() {
    const [activeToolId, setActiveToolId] = useState<(typeof tools)[number]["id"]>("compress");
    const [isSwitchingTool, setIsSwitchingTool] = useState(false);
    const activeTool = tools.find((tool) => tool.id === activeToolId) ?? tools[0];

    useEffect(() => {
        setIsSwitchingTool(true);
        const timeoutId = window.setTimeout(() => setIsSwitchingTool(false), 180);

        return () => window.clearTimeout(timeoutId);
    }, [activeToolId]);

    function focusTool(toolId: (typeof tools)[number]["id"]) {
        setActiveToolId(toolId);
        requestAnimationFrame(() => document.getElementById(`tool-tab-${toolId}`)?.focus());
    }

    function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, toolId: (typeof tools)[number]["id"]) {
        const currentIndex = tools.findIndex((tool) => tool.id === toolId);
        const previousTool = tools[(currentIndex - 1 + tools.length) % tools.length];
        const nextTool = tools[(currentIndex + 1) % tools.length];

        if (event.key === "ArrowLeft" && previousTool) {
            event.preventDefault();
            focusTool(previousTool.id);
            return;
        }

        if (event.key === "ArrowRight" && nextTool) {
            event.preventDefault();
            focusTool(nextTool.id);
            return;
        }

        if (event.key === "Home") {
            event.preventDefault();
            focusTool(tools[0].id);
            return;
        }

        if (event.key === "End") {
            event.preventDefault();
            focusTool(tools[tools.length - 1].id);
        }
    }

    const tabButtons = tools.map((tool) => (
        <li className="contents" key={tool.id}>
            <button
                aria-controls="tool-folder-panel"
                aria-selected={tool.id === activeTool.id}
                className={[
                    "relative z-0 flex min-h-18 min-w-40 translate-y-3 flex-col items-start justify-end gap-1.5 rounded-t-[14px] border border-b-0 border-stone-950 px-5 pb-4 pt-4 text-left shadow-[4px_0_0_rgba(28,25,23,0.14)] transition-[transform,box-shadow,padding] duration-200 ease-out focus-visible:z-30 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[#008fbe] motion-reduce:transition-none sm:min-w-50 sm:px-6",
                    tool.color,
                    tool.id === activeTool.id
                        ? "z-20 translate-y-px pb-[1.1rem] shadow-[6px_0_0_rgba(28,25,23,0.16)] after:absolute after:inset-x-0 after:-bottom-2 after:h-3 after:bg-inherit"
                        : "hover:translate-y-1 hover:shadow-[5px_0_0_rgba(28,25,23,0.16)]",
                ].join(" ")}
                id={`tool-tab-${tool.id}`}
                onKeyDown={(event) => handleTabKeyDown(event, tool.id)}
                onClick={() => setActiveToolId(tool.id)}
                role="tab"
                tabIndex={tool.id === activeTool.id ? 0 : -1}
                type="button"
            >
                <span className="text-xs font-black uppercase leading-none text-stone-600 sm:text-sm">{tool.shortLabel}</span>
                <span className="text-xl font-black leading-none text-stone-950 sm:text-2xl">{tool.label}</span>
            </button>
        </li>
    ));

    return (
        <main className="mx-auto w-full max-w-7xl px-4 pb-8 pt-1 sm:px-6 lg:px-8" id="main-content">
            <section className="flex min-h-[calc(100dvh-8rem)] flex-col" aria-labelledby="product-title">
                <h1 className="sr-only" id="product-title">
                    Local PDF tools
                </h1>

                <div className="mt-2 scroll-mt-8 drop-shadow-[0_18px_22px_rgba(28,25,23,0.10)]" id="tools">
                    <div className="relative z-20 overflow-x-auto px-1 pt-1">
                        <ul className="m-0 flex min-w-max list-none items-end gap-1 p-0 pl-1" aria-label="PDF tools" aria-orientation="horizontal" role="tablist">
                            {tabButtons}
                        </ul>
                    </div>

                    <section
                        aria-labelledby={`tool-tab-${activeTool.id}`}
                        className={`relative z-10 -mt-px min-h-[32rem] overflow-hidden rounded-r-[16px] rounded-bl-[16px] border border-stone-950 ${activeTool.color} p-5 shadow-[10px_10px_0_#1c1917] transition-colors duration-200 ease-out sm:p-7 lg:p-8`}
                        id="tool-folder-panel"
                        role="tabpanel"
                    >
                        <div
                            className={[
                                "relative min-h-[27rem] overflow-hidden border border-stone-950 bg-[#fffdf4] p-6 shadow-[5px_5px_0_rgba(28,25,23,0.18)] transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none sm:p-8",
                                isSwitchingTool ? "translate-y-1 opacity-90" : "translate-y-0 opacity-100",
                            ].join(" ")}
                        >
                            <div className="pointer-events-none absolute inset-x-8 top-[7.5rem] border-t border-stone-950/10" aria-hidden="true" />
                            <div className="pointer-events-none absolute inset-x-8 top-[9.75rem] border-t border-stone-950/10" aria-hidden="true" />
                            <div className="pointer-events-none absolute inset-x-8 top-[12rem] border-t border-stone-950/10" aria-hidden="true" />
                            <div className="pointer-events-none absolute inset-y-0 left-6 border-l border-red-300" aria-hidden="true" />

                            <div className="relative max-w-3xl">
                                <h2 className="m-0 font-serif text-4xl leading-none tracking-normal text-stone-950 sm:text-5xl">{activeTool.title}</h2>
                                <p className="m-0 mt-3 text-lg font-bold leading-7 text-stone-600">{activeTool.helper}</p>
                            </div>

                            <div className="relative mt-8 min-h-[16rem] border border-dashed border-stone-400 bg-[#fffdf4]" aria-hidden="true" />
                        </div>
                    </section>
                </div>
            </section>
        </main>
    );
}
