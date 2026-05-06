import { formatBytes } from "@pdfly/wasm";
import { RiArrowDownSLine, RiArrowUpSLine, RiCloseLine, RiFilePdf2Line } from "@remixicon/react";
import { Button } from "@/components/ui/shadcn/Button";

export function PdfFilesList({ files, onRemove, onMove }: { files: File[]; onRemove?: (index: number) => void; onMove?: (index: number, direction: -1 | 1) => void }) {
    return (
        <div className="space-y-2">
            {files.map((file, index) => (
                <div key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-2 rounded-[6px] border border-app-border bg-app-surface px-3 py-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-[5px] border border-app-border-strong bg-app-surface-muted text-brand">
                        <RiFilePdf2Line className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-neutral-100">{file.name}</div>
                        <div className="text-[11px] text-neutral-500">{formatBytes(file.size)}</div>
                    </div>
                    {onMove && (
                        <div className="flex items-center gap-1">
                            <Button aria-label="Move PDF up" disabled={index === 0} size="icon-xs" variant="secondary" onClick={() => onMove(index, -1)}>
                                <RiArrowUpSLine className="size-4" />
                            </Button>
                            <Button aria-label="Move PDF down" disabled={index === files.length - 1} size="icon-xs" variant="secondary" onClick={() => onMove(index, 1)}>
                                <RiArrowDownSLine className="size-4" />
                            </Button>
                        </div>
                    )}
                    {onRemove && (
                        <Button aria-label="Remove PDF" size="icon-xs" variant="secondary" onClick={() => onRemove(index)}>
                            <RiCloseLine className="size-4" />
                        </Button>
                    )}
                </div>
            ))}
        </div>
    );
}
