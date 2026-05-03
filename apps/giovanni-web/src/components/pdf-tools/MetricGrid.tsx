import * as React from "react";
import { cn } from "../../lib/utils";

export function MetricGrid({ metrics }: { metrics: Array<{ label: string; value: React.ReactNode; tone?: "accent" | "neutral" }> }) {
    return (
        <div className="grid grid-cols-2 gap-2">
            {metrics.map((metric) => (
                <div key={metric.label} className="rounded-[6px] border border-[#2a2a2a] bg-[#101010] px-3 py-2">
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">{metric.label}</div>
                    <div className={cn("mt-1 text-[13px] font-medium", metric.tone === "accent" ? "text-[#eb5a3f]" : "text-neutral-100")}>{metric.value}</div>
                </div>
            ))}
        </div>
    );
}
