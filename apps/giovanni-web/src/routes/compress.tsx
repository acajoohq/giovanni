import { RiFilePdfLine, RiFileZipLine, RiSettings3Line } from "@remixicon/react";
import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "../components/tool-layout";

export const Route = createFileRoute("/compress")({
    component: CompressRoute,
});

function CompressRoute() {
    return (
        <ToolLayout
            title="Compress PDF"
            items={[
                {
                    id: "1",
                    title: "presentation.pdf",
                    description: "Selected file",
                    icon: <RiFilePdfLine className="size-6" />,
                    iconBg: "#eb5a3f",
                    iconColor: "#fff",
                    rightText: "42.8 MB",
                },
                {
                    id: "2",
                    title: "Extreme Compression",
                    description: "Less quality, high compression",
                    icon: <RiFileZipLine className="size-6" />,
                    iconBg: "#2a2a2a",
                    iconColor: "#888",
                    rightText: "Optional",
                },
                {
                    id: "3",
                    title: "Advanced Settings",
                    description: "Image DPI and Quality",
                    icon: <RiSettings3Line className="size-6" />,
                    iconBg: "#2a2a2a",
                    iconColor: "#888",
                    rightText: "Optional",
                },
            ]}
            summary={[
                { label: "Original Size", value: "42.8 MB" },
                { label: "Compression Level", value: "Recommended" },
                { label: "Est. New Size", value: "~8.5 MB", highlight: true },
            ]}
            total={{
                label: "Output",
                value: "1 file",
            }}
            footerText={
                <>
                    Compression maintains visual quality for most text documents. You can check your recent compressed files anytime via your{" "}
                    <span className="text-[#eb5a3f]">History page</span>.
                </>
            }
            executeText="Compress"
        />
    );
}
