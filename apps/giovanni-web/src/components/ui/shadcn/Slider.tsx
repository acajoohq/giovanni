import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "@/lib/utils";

type SliderProps = Omit<React.ComponentProps<typeof SliderPrimitive.Root<number>>, "children">;

function Slider({ className, ...props }: SliderProps) {
    return (
        <SliderPrimitive.Root data-slot="slider" className={cn("relative flex h-5 w-full touch-none items-center select-none data-disabled:opacity-50", className)} {...props}>
            <SliderPrimitive.Control data-slot="slider-control" className="relative flex w-full items-center">
                <SliderPrimitive.Track
                    data-slot="slider-track"
                    className="relative h-[3px] grow overflow-hidden rounded-full bg-[linear-gradient(to_bottom,#050505,#121212)] shadow-[inset_0_1px_1px_rgba(0,0,0,0.95),0_1px_0_rgba(255,255,255,0.08)]"
                >
                    <SliderPrimitive.Indicator data-slot="slider-indicator" className="absolute h-full bg-transparent" />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb
                    data-slot="slider-thumb"
                    className="block size-3 rounded-full border border-[#5b5b5b] bg-[linear-gradient(to_bottom,#b5b5b5,#787878)] shadow-[0_1px_2px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.45)] transition-colors hover:border-[#737373] hover:bg-[linear-gradient(to_bottom,#c7c7c7,#858585)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-app-control disabled:pointer-events-none disabled:opacity-50"
                />
            </SliderPrimitive.Control>
        </SliderPrimitive.Root>
    );
}

export { Slider };
