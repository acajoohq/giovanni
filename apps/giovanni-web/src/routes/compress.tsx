import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "../components/ToolLayout";
import { RiFileZipLine, RiAddLine } from "@remixicon/react";
import { Input } from "../components/shadcn-ui/Input";
import {
    Sidebar,
    SidebarSection,
    SidebarHeader,
    SidebarContent,
    SidebarField,
    SidebarToggleGroup,
    SidebarToggle,
    SidebarCheckbox,
    SidebarFooter,
    SidebarStat,
} from "../components/sidebar";
import { EmptyState } from "../components/empty-state/EmptyState";

export const Route = createFileRoute("/compress")({
    component: CompressRoute,
});

function CompressRoute() {
    const sidebar = (
        <Sidebar>
            <SidebarSection>
                <SidebarHeader>Compression</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="Profile">
                        <SidebarToggleGroup>
                            <SidebarToggle isActive>Balanced</SidebarToggle>
                            <SidebarToggle>Extreme</SidebarToggle>
                        </SidebarToggleGroup>
                    </SidebarField>
                </SidebarContent>
            </SidebarSection>

            <SidebarSection>
                <SidebarHeader>Image Settings</SidebarHeader>
                <SidebarContent>
                    <SidebarField label="DPI">
                        <Input
                            defaultValue="144"
                            type="number"
                            className="h-7 px-2 rounded-[4px] bg-[#111] border-[#282828] text-[12px] text-white focus-visible:ring-1 focus-visible:ring-[#eb5a3f] shadow-inner"
                        />
                    </SidebarField>
                    <SidebarField label="Quality (%)">
                        <Input
                            defaultValue="65"
                            type="number"
                            className="h-7 px-2 rounded-[4px] bg-[#111] border-[#282828] text-[12px] text-white focus-visible:ring-1 focus-visible:ring-[#eb5a3f] shadow-inner"
                        />
                    </SidebarField>
                    
                    <SidebarCheckbox label="Grayscale" />
                </SidebarContent>
            </SidebarSection>

            <SidebarFooter>
                <SidebarStat label="Original Size" value="45.2 MB" />
                <SidebarStat label="Est. New Size" value="~8.5 MB" isHighlight />
                <SidebarStat label="Savings" value="81%" isHighlight />
            </SidebarFooter>
        </Sidebar>
    );

    const visual = (
        <>
            {/* Vise / Clamp background */}
            <div className="absolute inset-x-0 h-24 bg-[#111] border border-[#222] rounded-3xl shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)] transform scale-95 transition-transform duration-500 group-hover:scale-100 flex items-center justify-between px-2">
                <div className="w-2 h-12 bg-[#222] rounded-full shadow-[inset_1px_0_2px_rgba(255,255,255,0.1)]"></div>
                <div className="w-2 h-12 bg-[#222] rounded-full shadow-[inset_-1px_0_2px_rgba(255,255,255,0.1)]"></div>
            </div>

            {/* File being squeezed */}
            <div className="relative w-16 h-20 bg-linear-to-br from-[#eb5a3f] to-[#b33e29] rounded-xl shadow-[0_10px_20px_rgba(235,90,63,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-[#ff7b63] flex flex-col items-center justify-center transition-all duration-500 group-hover:scale-95 group-hover:w-14 z-10">
                <RiFileZipLine className="size-6 text-white/90 drop-shadow-md" />
                {/* Page fold */}
                <div className="absolute top-0 right-0 w-4 h-4 bg-linear-to-bl from-white/40 to-transparent rounded-bl-lg shadow-sm"></div>
            </div>
        </>
    );

    return (
        <ToolLayout title="Compress PDF" actionText="Compress" sidebar={sidebar}>
            <EmptyState
                title="Drop a PDF to compress"
                description="Secure, offline processing."
                badgeIcon={<RiAddLine className="size-5" />}
                visual={visual}
            />
        </ToolLayout>
    );
}
