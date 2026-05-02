import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ToolTabList, type Tool } from "../components/home/tool-tabs";
import { createSeoMeta } from "../lib/seo";

const tools = [
    {
        id: "compress",
        label: "Compress PDF",
        shortLabel: "Compress",
        color: "bg-[#fff2a8]",
        title: "Compress PDF",
        helper: "Reduce file size locally — no upload required.",
    },
    {
        id: "split",
        label: "Split Pages",
        shortLabel: "Split",
        color: "bg-[#ccebdc]",
        title: "Split Pages",
        helper: "Export a subset of pages into a new document.",
    },
    {
        id: "merge",
        label: "Merge PDFs",
        shortLabel: "Merge",
        color: "bg-[#ffd2c8]",
        title: "Merge PDFs",
        helper: "Stack multiple files into one, in any order.",
    },
    {
        id: "images",
        label: "Extract Images",
        shortLabel: "Images",
        color: "bg-[#d9dcff]",
        title: "Extract Images",
        helper: "Pull every embedded image out of a PDF.",
    },
] as const satisfies readonly Tool[];

export const Route = createFileRoute("/")({
    head: () => ({
        meta: createSeoMeta({
            title: "Giovanni | Frugal PDF Tools",
            description:
                "A pastel, local-first PDF workspace for compressing, splitting, merging, and extracting images.",
        }),
    }),
    component: HomePage,
});

function HomePage() {
    const [activeToolId, setActiveToolId] = useState<(typeof tools)[number]["id"]>("compress");
    const activeTool = tools.find((t) => t.id === activeToolId) ?? tools[0];

    return (
        <main className="mx-auto w-full max-w-7xl px-4 pb-8 pt-1 sm:px-6 lg:px-8" id="main-content">
            <section aria-labelledby="product-title" className="flex min-h-[calc(100dvh-8rem)] flex-col">
                <h1 className="sr-only" id="product-title">
                    Local PDF tools
                </h1>

                <div className="mt-2 scroll-mt-8 drop-shadow-[0_16px_24px_rgba(28,25,23,0.09)]" id="tools">
                    <ToolTabList
                        activeToolId={activeToolId}
                        onToolChange={(id) => setActiveToolId(id as (typeof tools)[number]["id"])}
                        tools={tools}
                    />

                    {/* Tab panel — background color transitions when tool changes */}
                    <section
                        aria-labelledby={`tool-tab-${activeTool.id}`}
                        className={`relative z-10 -mt-px min-h-[32rem] overflow-hidden rounded-tl-[16px] rounded-r-[16px] rounded-bl-[16px] border border-stone-950 p-5 shadow-[8px_8px_0_#1c1917] transition-colors duration-250 ease-out sm:p-7 lg:p-8 ${activeTool.color}`}
                        id="tool-folder-panel"
                        role="tabpanel"
                    >
                        {/* Paper card with animated content swap */}
                        <AnimatePresence initial={false} mode="wait">
                            <motion.div
                                key={activeTool.id}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative min-h-[27rem] overflow-hidden border border-stone-950 bg-[#fffdf4] p-6 shadow-[5px_5px_0_rgba(28,25,23,0.16)] sm:p-8"
                                exit={{ opacity: 0, y: -5 }}
                                initial={{ opacity: 0, y: 7 }}
                                transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
                            >
                                {/* Notebook decoration — margin line + ruled lines */}
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-y-0 left-6 border-l border-red-300/50"
                                />
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-x-8 top-[7.5rem] border-t border-stone-950/[0.06]"
                                />
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-x-8 top-[9.75rem] border-t border-stone-950/[0.06]"
                                />
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-x-8 top-[12rem] border-t border-stone-950/[0.06]"
                                />

                                {/* Tool header */}
                                <div className="relative max-w-3xl">
                                    <h2 className="m-0 font-serif text-4xl leading-none tracking-normal text-stone-950 sm:text-5xl">
                                        {activeTool.title}
                                    </h2>
                                    <p className="m-0 mt-3 text-[0.9375rem] font-bold leading-6 text-stone-500">
                                        {activeTool.helper}
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </section>
                </div>
            </section>
        </main>
    );
}
