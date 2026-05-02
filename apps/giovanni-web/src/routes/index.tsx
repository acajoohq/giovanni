import { RiFilePdfLine, RiMagicLine, RiShieldKeyholeLine } from "@remixicon/react";
import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "../components/tool-layout";

export const Route = createFileRoute("/")({
    component: MergeRoute,
});

function MergeRoute() {
    return (
        <ToolLayout
            title="Merge PDF"
            items={[
                {
                    id: "1",
                    title: "document-1.pdf",
                    description: "Ready to merge",
                    icon: <RiFilePdfLine className="size-6" />,
                    iconBg: "#eb5a3f",
                    iconColor: "#fff",
                    rightText: "2.4 MB",
                },
                {
                    id: "2",
                    title: "Enhance Quality",
                    description: "AI Tool",
                    icon: <RiMagicLine className="size-6" />,
                    iconBg: "#2a2a2a",
                    iconColor: "#888",
                    rightText: "Optional",
                },
                {
                    id: "3",
                    title: "Encrypt PDF",
                    description: "Smart track and manage",
                    icon: <RiShieldKeyholeLine className="size-6" />,
                    iconBg: "#2a2a2a",
                    iconColor: "#888",
                    rightText: "Optional",
                },
            ]}
            summary={[
                { label: "Files", value: "1 file" },
                { label: "Total Pages", value: "12 pages" },
                { label: "Estimated Size", value: "~2.4 MB", highlight: true },
            ]}
            total={{
                label: "Output",
                value: "1 file",
            }}
            footerText={
                <>
                    If the files exceed the limit, we'll notify you beforehand. You can check your recent merges anytime via your{" "}
                    <span className="text-[#eb5a3f]">Account page</span>.
                </>
            }
            executeText="Merge"
        />
    );
}
