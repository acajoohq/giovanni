import { formatBytes, type ExtractedImage } from "@giovanni/core";
import { RiImageLine } from "@remixicon/react";

export function ExtractedImageCard({ image, url, index }: { image: ExtractedImage; url: string | null; index: number }) {
    const thumbnailContent = url ? (
        <img alt={`Extracted image ${index + 1}`} className="h-full w-full object-contain" src={url} />
    ) : (
        <div className="px-3 text-center text-[11px] text-muted-foreground">
            <RiImageLine className="mx-auto mb-2 size-5 text-app-text-subtle" />
            {image.unsupportedReason ?? "Raw bytes only"}
        </div>
    );

    return (
        <div className="overflow-hidden rounded-[6px] border border-app-border bg-app-surface">
            <div className="flex aspect-4/3 items-center justify-center border-b border-app-border bg-app-bg">{thumbnailContent}</div>
            <div className="space-y-1 p-3">
                <div className="text-[12px] font-medium text-foreground">
                    {image.width}x{image.height}
                </div>
                <div className="text-[11px] text-muted-foreground">
                    {image.filter} · page {image.pageIndex + 1} · {formatBytes(image.bytes.byteLength)}
                </div>
            </div>
        </div>
    );
}
