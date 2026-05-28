export interface OrganizePage {
    sourceIndex: number;
    data: Uint8Array;
}

export function createOrganizePages(pages: Uint8Array[]): OrganizePage[] {
    return pages.map((data, sourceIndex) => ({ sourceIndex, data }));
}

export function isOrganizeOrderChanged(pages: OrganizePage[], sourcePageCount: number): boolean {
    return pages.length > 0 && (pages.length !== sourcePageCount || pages.some((page, index) => page.sourceIndex !== index));
}

export function moveOrganizePage(pages: OrganizePage[], index: number, direction: -1 | 1): OrganizePage[] {
    return moveItem(pages, index, index + direction);
}

export function removeOrganizePage(pages: OrganizePage[], index: number): OrganizePage[] {
    if (index < 0 || index >= pages.length) {
        return pages;
    }

    const nextPages = [...pages];
    nextPages.splice(index, 1);
    return nextPages;
}

export function moveOrganizePageToDropSlot(pages: OrganizePage[], draggedIndex: number, dragOverIndex: number): OrganizePage[] {
    if (isNoOpOrganizeDrop(draggedIndex, dragOverIndex) || draggedIndex < 0 || draggedIndex >= pages.length || dragOverIndex < 0 || dragOverIndex > pages.length) {
        return pages;
    }

    return moveItem(pages, draggedIndex, draggedIndex < dragOverIndex ? dragOverIndex - 1 : dragOverIndex);
}

export function isNoOpOrganizeDrop(draggedIndex: number | null, dragOverIndex: number | null): boolean {
    return draggedIndex !== null && dragOverIndex !== null && (dragOverIndex === draggedIndex || dragOverIndex === draggedIndex + 1);
}

function moveItem<TItem>(items: TItem[], fromIndex: number, toIndex: number): TItem[] {
    if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
        return items;
    }

    const nextItems = [...items];
    const [item] = nextItems.splice(fromIndex, 1);

    if (item === undefined) {
        return items;
    }

    nextItems.splice(toIndex, 0, item);
    return nextItems;
}
