import { RiArrowLeftSLine, RiCloseLine } from "@remixicon/react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import type * as React from "react";

interface ToolLayoutProps {
    title: string;
    items: {
        id: string;
        title: string;
        description: string;
        icon: React.ReactNode;
        iconBg?: string;
        iconColor?: string;
        rightText?: string;
    }[];
    summary: {
        label: string;
        value: string;
        highlight?: boolean;
    }[];
    total: {
        label: string;
        value: string;
    };
    footerText?: React.ReactNode;
    executeText: string;
}

export function ToolLayout({ title, items, summary, total, footerText, executeText }: ToolLayoutProps) {
    return (
        <div className="h-full flex flex-col xl:flex-row p-4 md:p-6 gap-6">
            {/* Main Workspace / Dropzone */}
            <div className="flex-1 rounded-3xl border-2 border-dashed border-white/10 bg-[#111] flex items-center justify-center relative overflow-hidden group hover:border-[#eb5a3f]/30 transition-colors duration-300 min-h-[400px] xl:min-h-0">
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: "radial-gradient(circle at center, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
                ></div>
                <div className="flex flex-col items-center text-center p-8 z-10">
                    <div className="size-20 rounded-full bg-[#1a1a1a] shadow-skeuo-inner border border-black/50 flex items-center justify-center mb-6 text-neutral-400 group-hover:text-[#eb5a3f] transition-colors duration-300">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">Select files or drag and drop</h3>
                    <p className="text-sm text-neutral-500 max-w-[300px]">All processing is done locally in your browser. Your files are completely private and never uploaded.</p>
                </div>
            </div>

            {/* Right Actions Panel (Skeuomorphic Card) */}
            <div className="w-full xl:w-[440px] flex-shrink-0 flex flex-col">
                <Card className="w-full h-full flex flex-col p-0 gap-0 bg-[#141414] border-[#222] ring-0 shadow-[0_24px_40px_-12px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-4 flex-shrink-0">
                        <Button variant="secondary" size="icon" className="rounded-full size-10 bg-[#1c1c1e] border-0 shadow-skeuo-sm hover:bg-[#252525] text-neutral-400">
                            <RiArrowLeftSLine className="size-5" />
                        </Button>
                        <h2 className="text-lg font-medium text-white">{title}</h2>
                        <Button variant="secondary" size="icon" className="rounded-full size-10 bg-[#1c1c1e] border-0 shadow-skeuo-sm hover:bg-[#252525] text-neutral-400">
                            <RiCloseLine className="size-5" />
                        </Button>
                    </div>

                    <div className="px-6 py-2 flex-1 overflow-y-auto min-h-0">
                        {/* Items List */}
                        <div className="flex flex-col gap-6 mb-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div
                                            className="size-12 rounded-full flex items-center justify-center shadow-skeuo-inner border border-black/50 flex-shrink-0"
                                            style={{
                                                backgroundColor: item.iconBg || "#2a2a2a",
                                                color: item.iconColor || "#fff",
                                            }}
                                        >
                                            {item.icon}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[15px] font-medium text-white leading-tight truncate">{item.title}</span>
                                            <span className="text-[13px] text-neutral-500 mt-0.5 truncate">{item.description}</span>
                                        </div>
                                    </div>
                                    {item.rightText && <div className="text-[15px] font-medium text-neutral-300 ml-3 flex-shrink-0">{item.rightText}</div>}
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="flex items-center gap-3 mb-8">
                            <Input
                                placeholder="Output filename"
                                className="bg-[#1a1a1a] border-black/40 shadow-skeuo-inner px-4 text-sm rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-white/20"
                            />
                            <Button
                                variant="secondary"
                                className="h-11 px-5 rounded-xl bg-[#282828] text-sm font-medium hover:bg-[#333] shadow-skeuo border border-white/5 text-white"
                            >
                                Apply
                            </Button>
                        </div>

                        {/* Summary */}
                        <div className="flex flex-col gap-3 mb-6 border-b border-white/5 pb-6">
                            {summary.map((row) => (
                                <div key={row.label} className="flex items-center justify-between text-[15px]">
                                    <span className="text-neutral-400">{row.label}</span>
                                    <span className={row.highlight ? "text-[#eb5a3f]" : "text-neutral-300"}>{row.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xl font-medium text-white">{total.label}</span>
                            <span className="text-xl font-medium text-white">{total.value}</span>
                        </div>

                        {/* Footer Text */}
                        {footerText && <p className="text-[13px] text-neutral-500 leading-relaxed mb-6">{footerText}</p>}
                    </div>

                    {/* Actions */}
                    <div className="p-4 bg-[#111] border-t border-white/5 flex gap-3 flex-shrink-0">
                        <Button
                            variant="secondary"
                            className="flex-1 h-[52px] rounded-xl bg-[#282828] hover:bg-[#333] text-base font-medium shadow-skeuo border border-white/5 text-white"
                        >
                            Cancel
                        </Button>
                        <Button className="flex-1 h-[52px] rounded-xl bg-[#eb5a3f] hover:bg-[#d65037] text-base font-medium shadow-skeuo border border-black/20 text-white">
                            {executeText}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
