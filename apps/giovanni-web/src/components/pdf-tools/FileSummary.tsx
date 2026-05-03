import { formatBytes } from "@pdfly/wasm";
import * as React from "react";
import { RiFilePdf2Line } from "@remixicon/react";

export function FileSummary({ file }: { file: File }) {
    return (
        <div className="flex min-w-0 items-center gap-3 rounded-[6px] border border-[#2a2a2a] bg-[#101010] px-3 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[5px] border border-[#393939] bg-[#1c1c1c] text-[#eb5a3f]">
                <RiFilePdf2Line className="size-4" />
            </div>
            <div className="min-w-0">
                <div className="truncate text-[12px] font-medium text-neutral-100">{file.name}</div>
                <div className="text-[11px] text-neutral-500">{formatBytes(file.size)}</div>
            </div>
        </div>
    );
}
