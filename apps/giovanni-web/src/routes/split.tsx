import { RiFilePdfLine, RiPagesLine, RiScissorsCutLine } from "@remixicon/react";
import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "../components/tool-layout";

export const Route = createFileRoute("/split")({
    component: SplitRoute,
});

function SplitRoute() {
    return (
        <ToolLayout
            title="Split PDF"
            items={[
                {
                    id: "1",
                    title: "annual-report.pdf",
                    description: "Selected file",
                    icon: <RiFilePdfLine className="size-6" />,
                    iconBg: "#eb5a3f",
                    iconColor: "#fff",
                    rightText: "15.2 MB",
                },
                {
                    id: "2",
                    title: "Split by ranges",
                    description: "Custom pages",
                    icon: <RiScissorsCutLine className="size-6" />,
                    iconBg: "#2a2a2a",
                    iconColor: "#888",
                    rightText: "2 parts",
                },
                {
                    id: "3",
                    title: "Extract all pages",
                    description: "Separate files",
                    icon: <RiPagesLine className="size-6" />,
                    iconBg: "#2a2a2a",
                    iconColor: "#888",
                    rightText: "Optional",
                },
            ]}
            summary={[
                { label: "Original Pages", value: "142 pages" },
                { label: "Parts to create", value: "2 parts" },
                { label: "Processing", value: "Fast mode", highlight: true },
            ]}
            total={{
                label: "Output",
                value: "2 files",
            }}
            footerText={
                <>
                    The split process is done locally. Your files are not uploaded. You can view all your processed documents in your{" "}
                    <span className="text-[#eb5a3f]">History</span>.
                </>
            }
            executeText="Split"
        />
    );
}
