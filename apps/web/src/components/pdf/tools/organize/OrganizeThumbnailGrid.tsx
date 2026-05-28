import { Fragment, type DragEvent } from "react";
import type { OrganizePage } from "@/lib/features/pdfTools/utils/organizeTool.utils";
import { OrganizeDropIndicator } from "./OrganizeDropIndicator";
import { OrganizePageCard } from "./OrganizePageCard";

interface OrganizeThumbnailGridProps {
    pages: OrganizePage[];
    draggedIndex: number | null;
    dragOverIndex: number | null;
    showDropIndicator: boolean;
    onDragStart: (index: number) => void;
    onDragOver: (e: DragEvent<HTMLDivElement>, index: number) => void;
    onDrop: () => void;
    onDragEnd: () => void;
    onMove: (index: number, direction: -1 | 1) => void;
    onDelete: (index: number) => void;
}

export function OrganizeThumbnailGrid({
    pages,
    draggedIndex,
    dragOverIndex,
    showDropIndicator,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    onMove,
    onDelete,
}: OrganizeThumbnailGridProps) {
    return (
        <div className="h-full w-full overflow-y-auto p-3 pb-24">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {pages.map((page, currentIndex) => (
                    <Fragment key={page.sourceIndex}>
                        {showDropIndicator && dragOverIndex === currentIndex ? <OrganizeDropIndicator onDrop={onDrop} /> : null}
                        <OrganizePageCard
                            currentIndex={currentIndex}
                            originalIndex={page.sourceIndex}
                            pageCount={pages.length}
                            pageData={page.data}
                            isDragSource={draggedIndex === currentIndex}
                            onDragEnd={onDragEnd}
                            onDragOver={(e) => onDragOver(e, currentIndex)}
                            onDragStart={() => onDragStart(currentIndex)}
                            onDrop={onDrop}
                            onMove={(dir) => onMove(currentIndex, dir)}
                            onDelete={() => onDelete(currentIndex)}
                        />
                    </Fragment>
                ))}
                {showDropIndicator && dragOverIndex === pages.length ? <OrganizeDropIndicator onDrop={onDrop} /> : null}
            </div>
        </div>
    );
}
