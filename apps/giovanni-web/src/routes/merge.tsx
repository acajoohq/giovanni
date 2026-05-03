import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "../components/ToolLayout";
import { RiAddLine, RiStackLine } from "@remixicon/react";
import { Input } from "../components/shadcn-ui/Input";
import {
    Sidebar,
    SidebarSection,
    SidebarHeader,
    SidebarContent,
    SidebarField,
    SidebarCheckbox,
    SidebarInfo,
} from "../components/sidebar";
import { EmptyState } from "../components/empty-state/EmptyState";

export const Route = createFileRoute("/merge")({
    component: MergeRoute,
});

function MergeRoute() {
    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>Output Settings</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Filename">
                        <Input
                            defaultValue=""
                            className="h-7 px-2 rounded-[4px] bg-[#111] border-[#282828] text-[12px] text-white focus-visible:ring-1 focus-visible:ring-[#eb5a3f] shadow-inner"
                        />
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            <SidebarSection>
                <SidebarHeader>Advanced Options</SidebarHeader>
                <SidebarContent>
                    <SidebarCheckbox label="Add Bookmarks" />
                    <SidebarCheckbox label="Normalize Size" />
                </SidebarContent>
            </SidebarSection>

            <SidebarInfo>
                Select multiple PDF files to merge them into a single document.
            </SidebarInfo>
        </Sidebar>
    );

    const visual = (
        <>
            {/* Back file */}
            <div className="absolute w-16 h-20 bg-linear-to-br from-[#1a1a1a] to-[#111] rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#333] -rotate-12 -translate-x-3 translate-y-1 transition-all duration-500 group-hover:rotate-[-15deg] group-hover:-translate-x-5"></div>
            {/* Middle file */}
            <div className="absolute w-16 h-20 bg-linear-to-br from-[#222] to-[#1a1a1a] rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-[#444] rotate-6 translate-x-3 translate-y-1 transition-all duration-500 group-hover:rotate-12 group-hover:translate-x-5"></div>
            {/* Front file */}
            <div className="absolute w-16 h-20 bg-linear-to-br from-[#eb5a3f] to-[#b33e29] rounded-xl shadow-[0_10px_20px_rgba(235,90,63,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-[#ff7b63] flex flex-col items-center justify-center z-10 transition-transform duration-500 group-hover:scale-105">
                <RiStackLine className="size-6 text-white/90 drop-shadow-md" />
                <div className="absolute top-0 right-0 w-4 h-4 bg-linear-to-bl from-white/40 to-transparent rounded-bl-lg shadow-sm"></div>
            </div>
        </>
    );

    return (
        <ToolLayout title="Merge" actionText="Select PDFs" sidebar={sidebar}>
            <EmptyState
                title="Drop PDFs to merge"
                description="Secure, offline processing."
                badgeIcon={<RiAddLine className="size-5" />}
                visual={visual}
                isMultiple
            />
        </ToolLayout>
    );
}
