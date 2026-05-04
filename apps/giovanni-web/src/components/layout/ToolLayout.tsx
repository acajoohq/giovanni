import * as React from "react";
import { RiUploadCloud2Line } from "@remixicon/react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/shadcn/Resizable";

interface ToolLayoutProps {
    title: string;
    sidebar: React.ReactNode;
    children: React.ReactNode;
    onFiles?: (files: File[]) => void;
    isMultiple?: boolean;
}

export function ToolLayout({ title, sidebar, children, onFiles, isMultiple }: ToolLayoutProps) {
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const [isDragOver, setIsDragOver] = React.useState(false);
    const dragCounter = React.useRef(0);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current++;
        if (dragCounter.current === 1) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) setIsDragOver(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragOver(false);
        if (!onFiles) return;
        onFiles(Array.from(e.dataTransfer.files));
    };

    const workspace = (
        <ToolWorkspace
            isDragOver={isDragOver}
            isMultiple={isMultiple}
            onDragEnter={onFiles ? handleDragEnter : undefined}
            onDragLeave={onFiles ? handleDragLeave : undefined}
            onDragOver={onFiles ? handleDragOver : undefined}
            onDrop={onFiles ? handleDrop : undefined}
        >
            {children}
        </ToolWorkspace>
    );

    if (isDesktop) {
        return (
            <ResizablePanelGroup className="h-full w-full bg-app-bg text-app-text" direction="horizontal">
                <ResizablePanel defaultSize={82} minSize={40}>
                    {workspace}
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel defaultSize={18} maxSize={35} minSize={14}>
                    <ToolSidebar sidebar={sidebar} title={title} />
                </ResizablePanel>
            </ResizablePanelGroup>
        );
    }

    return (
        <div className="flex h-full w-full flex-col bg-app-bg text-app-text lg:hidden">
            <div className="min-h-0 flex-1">{workspace}</div>
            <div className="max-h-[42vh] min-h-52 shrink-0 overflow-hidden border-t border-app-border">
                <ToolSidebar sidebar={sidebar} title={title} />
            </div>
        </div>
    );
}

function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = React.useState(false);

    React.useEffect(() => {
        const mediaQueryList = window.matchMedia(query);
        const updateMatches = () => setMatches(mediaQueryList.matches);

        updateMatches();
        mediaQueryList.addEventListener("change", updateMatches);

        return () => mediaQueryList.removeEventListener("change", updateMatches);
    }, [query]);

    return matches;
}

interface ToolWorkspaceProps extends React.HTMLAttributes<HTMLDivElement> {
    isDragOver: boolean;
    isMultiple?: boolean;
}

function ToolWorkspace({ children, isDragOver, isMultiple, ...props }: ToolWorkspaceProps) {
    return (
        <div className="relative h-full overflow-hidden bg-app-workspace" {...props}>
            <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                    backgroundImage: "radial-gradient(circle at center, rgba(255,255,255,0.05) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                }}
            />
            <div className="relative z-10 h-full w-full overflow-hidden">{children}</div>

            {isDragOver && (
                <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_50%,rgba(235,90,63,0.07),transparent)]" />
                    <div className="relative flex flex-col items-center gap-4">
                        <div className="flex size-16 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 shadow-brand-glow">
                            <RiUploadCloud2Line className="size-8 text-brand" />
                        </div>
                        <p className="text-[14px] font-semibold text-white/90">Drop {isMultiple ? "files" : "a file"} here</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function ToolSidebar({ sidebar, title }: { sidebar: React.ReactNode; title: string }) {
    return (
        <aside className="flex h-full flex-col border-l border-app-border bg-app-panel shadow-sidebar max-lg:border-l-0 max-lg:shadow-none">
            <div className="shrink-0 border-b border-app-border bg-app-panel-strong px-4 py-2">
                <h2 className="text-[12px] font-semibold tracking-wide text-neutral-300">{title}</h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">{sidebar}</div>
        </aside>
    );
}
