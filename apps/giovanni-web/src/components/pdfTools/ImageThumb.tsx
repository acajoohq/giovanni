import { formatBytes, type ExtractedImage } from "@pdfly/wasm";
import * as React from "react";
import { RiImageLine } from "@remixicon/react";

export function ImageThumb({ image, url, index }: { image: ExtractedImage; url: string | null; index: number }) {
    const thumbnailContent = url ? (
        <img alt={`Extracted image ${index + 1}`} className="h-full w-full object-contain" src={url} />
    ) : (
        <div className="px-3 text-center text-[11px] text-neutral-500">
            <RiImageLine className="mx-auto mb-2 size-5 text-neutral-600" />
            {image.unsupportedReason ?? "Raw bytes only"}
        </div>
    );

    return (
        <div className="overflow-hidden rounded-[6px] border border-app-border bg-app-surface">
            <div className="flex aspect-4/3 items-center justify-center border-b border-app-border bg-app-bg">{thumbnailContent}</div>
            <div className="space-y-1 p-3">
                <div className="text-[12px] font-medium text-neutral-100">
                    {image.width}x{image.height}
                </div>
                <div className="text-[11px] text-neutral-500">
                    {image.filter} · page {image.pageIndex + 1} · {formatBytes(image.bytes.byteLength)}
                </div>
            </div>
        </div>
    );
}
