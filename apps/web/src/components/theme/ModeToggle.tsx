import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
    const { setTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label="Toggle theme"
                className="relative flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-app-border-subtle hover:text-foreground"
            >
                <RiSunLine className="absolute size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <RiMoonLine className="size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                <span className="sr-only">Toggle theme</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    <RiSunLine className="size-4" />
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <RiMoonLine className="size-4" />
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    <RiComputerLine className="size-4" />
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
