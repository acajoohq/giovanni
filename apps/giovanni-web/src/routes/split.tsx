import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "../components/ToolLayout";
import { RiAddLine, RiScissorsCutLine } from "@remixicon/react";
import { Input } from "../components/shadcn-ui/Input";
import {
    Sidebar,
    SidebarSection,
    SidebarHeader,
    SidebarContent,
    SidebarField,
    SidebarToggleGroup,
    SidebarToggle,
    SidebarInfo,
} from "../components/sidebar";
import { EmptyState } from "../components/empty-state/EmptyState";

export const Route = createFileRoute("/split")({
    component: SplitRoute,
});

function SplitRoute() {
    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>Split Settings</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Mode">
                        <SidebarToggleGroup>
                            <SidebarToggle isActive>Range</SidebarToggle>
                            <SidebarToggle>Fixed Size</SidebarToggle>
                        </SidebarToggleGroup>
                    </SidebarField>

                    <SidebarField label="From Page">
                        <Input defaultValue="1" type="number" className="h-7 px-2 rounded-[4px] bg-[#111] border-[#282828] text-[12px] text-white focus-visible:ring-1 focus-visible:ring-[#eb5a3f] shadow-inner" />
                    </SidebarField>
                    
                    <SidebarField label="To Page">
                        <Input defaultValue="1" type="number" className="h-7 px-2 rounded-[4px] bg-[#111] border-[#282828] text-[12px] text-white focus-visible:ring-1 focus-visible:ring-[#eb5a3f] shadow-inner" />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            <SidebarSection>
                <SidebarHeader>Output</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Pattern">
                        <Input defaultValue="{basename}_split" className="h-7 px-2 rounded-[4px] bg-[#111] border-[#282828] text-[12px] text-white focus-visible:ring-1 focus-visible:ring-[#eb5a3f] shadow-inner" />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            <SidebarInfo>
                Select a PDF file to enable split options and preview pages.
            </SidebarInfo>
        </Sidebar>
    );

    const visual = (
        <div className="absolute inset-0 flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-500">
            <div className="relative w-16 h-20">
                {/* Top half */}
                <div className="absolute top-0 left-0 right-0 h-[38px] bg-linear-to-b from-[#2a2a2a] to-[#222] rounded-t-xl shadow-[0_5px_10px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#444] border-b-dashed transition-transform duration-500 group-hover:-translate-y-3 group-hover:-rotate-3 origin-bottom z-10 flex items-center justify-center overflow-hidden">
                    <div className="absolute top-0 right-0 w-4 h-4 bg-linear-to-bl from-white/20 to-transparent rounded-bl-sm shadow-sm"></div>
                </div>
                {/* Bottom half */}
                <div className="absolute bottom-0 left-0 right-0 h-[38px] bg-linear-to-t from-[#2a2a2a] to-[#222] rounded-b-xl shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(255,255,255,0.1)] border border-[#444] border-t-0 flex items-end justify-center pb-2 transition-transform duration-500 group-hover:translate-y-3 group-hover:rotate-3 origin-top z-10"></div>
                {/* Scissors */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#eb5a3f] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-125 z-20">
                    <RiScissorsCutLine className="size-6" />
                </div>
            </div>
        </div>
    );

    return (
        <ToolLayout title="Split" actionText="Select PDF" sidebar={sidebar}>
            <EmptyState
                title="Drop a PDF to split"
                description="Secure, offline processing."
                badgeIcon={<RiAddLine className="size-5" />}
                visual={visual}
            />
        </ToolLayout>
    );
}
