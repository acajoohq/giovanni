import type * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/shadcn/Input";

export function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
    return (
        <Input
            className={cn("h-7 rounded-[4px] border-app-border bg-app-control px-2 text-[12px] text-white shadow-inner focus-visible:ring-1 focus-visible:ring-brand", className)}
            {...props}
        />
    );
}

interface SidebarSelectOption<TValue extends string> {
    label: string;
    value: TValue;
}

interface SidebarSelectProps<TValue extends string> extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children" | "onChange" | "value"> {
    options: Array<SidebarSelectOption<TValue>>;
    value: TValue;
    onValueChange: (value: TValue) => void;
}

export function SidebarSelect<TValue extends string>({ className, options, value, onValueChange, ...props }: SidebarSelectProps<TValue>) {
    return (
        <select
            className={cn(
                "h-7 w-full appearance-none rounded-[4px] border border-app-border bg-app-control px-2 py-0 pr-7 text-[12px] leading-none text-white shadow-inner focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
                className,
            )}
            value={value}
            onChange={(event) => onValueChange(event.currentTarget.value as TValue)}
            {...props}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

export function SidebarReadonlyValue({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("flex h-7 items-center rounded-[4px] border border-app-border bg-app-control px-2 text-[12px] leading-none text-neutral-300 shadow-inner", className)}>
            {children}
        </div>
    );
}
