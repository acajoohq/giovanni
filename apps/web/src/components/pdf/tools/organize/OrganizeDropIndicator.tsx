interface OrganizeDropIndicatorProps {
    onDrop: () => void;
}

export function OrganizeDropIndicator({ onDrop }: OrganizeDropIndicatorProps) {
    return <div className="aspect-3/4 rounded-md border-2 border-dashed border-brand bg-brand/10" onDragOver={(e) => e.preventDefault()} onDrop={onDrop} />;
}
