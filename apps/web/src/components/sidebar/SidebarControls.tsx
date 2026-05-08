import type { ComponentProps, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/shadcn/Input";
import { Slider } from "@/components/ui/shadcn/Slider";

export function SidebarInput({ className, ...props }: ComponentProps<typeof Input>) {
    return (
        <Input
            className={cn("h-7 rounded-[4px] border-app-border bg-app-control px-2 text-[12px] text-foreground shadow-inner focus-visible:ring-1 focus-visible:ring-brand", className)}
            {...props}
        />
    );
}

interface SidebarSelectOption<TValue extends string> {
    label: string;
    value: TValue;
}

interface SidebarSelectProps<TValue extends string> extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "onChange" | "value"> {
    options: Array<SidebarSelectOption<TValue>>;
    value: TValue;
    onValueChange: (value: TValue) => void;
}

export function SidebarSelect<TValue extends string>({ className, options, value, onValueChange, ...props }: SidebarSelectProps<TValue>) {
    return (
        <select
            className={cn(
                "h-7 w-full appearance-none rounded-[4px] border border-app-border bg-app-control px-2 py-0 pr-7 text-[12px] leading-none text-foreground shadow-inner focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand",
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

export function SidebarReadonlyValue({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("flex h-7 items-center rounded-[4px] border border-app-border bg-app-control px-2 text-[12px] leading-none text-app-text-muted shadow-inner", className)}>
            {children}
        </div>
    );
}

interface SidebarRangeProps extends Omit<ComponentProps<typeof Slider>, "className"> {
    className?: string;
    label?: ReactNode;
    valueLabel?: ReactNode;
}

export function SidebarRange({ className, label, valueLabel, ...props }: SidebarRangeProps) {
    return (
        <div className={cn("grid items-center gap-2", label ? "grid-cols-[64px_minmax(0,1fr)_44px]" : "grid-cols-[1fr_44px]")}>
            {label && <div className="justify-self-end text-right text-[12px] leading-none text-muted-foreground">{label}</div>}
            <div className="flex h-7 items-center px-1">
                <Slider className={cn("min-w-0 flex-1", className)} {...props} />
            </div>
            {valueLabel && (
                <div className="flex h-7 items-center justify-end rounded-[3px] border border-app-border-strong bg-app-control px-2 text-[12px] font-semibold leading-none text-foreground shadow-[inset_0_1px_2px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.07)]">
                    {valueLabel}
                </div>
            )}
        </div>
    );
}
