import { describe, expect, it } from "vitest";
import {
    createOrganizePages,
    isNoOpOrganizeDrop,
    isOrganizeOrderChanged,
    moveOrganizePage,
    moveOrganizePageToDropSlot,
    removeOrganizePage,
    type OrganizePage,
} from "./organizeTool.utils";

function pages(sourceIndexes: number[]): OrganizePage[] {
    return sourceIndexes.map((sourceIndex) => ({ sourceIndex, data: new Uint8Array([sourceIndex]) }));
}

function sourceIndexes(organizePages: OrganizePage[]): number[] {
    return organizePages.map((page) => page.sourceIndex);
}

describe("organizeTool utils", () => {
    it("creates an ordered page model from split PDF pages", () => {
        expect(sourceIndexes(createOrganizePages([new Uint8Array([1]), new Uint8Array([2])]))).toEqual([0, 1]);
    });

    it("detects unchanged, reordered, and deleted page orders", () => {
        expect(isOrganizeOrderChanged(pages([0, 1, 2]), 3)).toBe(false);
        expect(isOrganizeOrderChanged(pages([1, 0, 2]), 3)).toBe(true);
        expect(isOrganizeOrderChanged(pages([0, 2]), 3)).toBe(true);
    });

    it("moves pages by button direction without mutating invalid moves", () => {
        const original = pages([0, 1, 2]);

        expect(sourceIndexes(moveOrganizePage(original, 1, -1))).toEqual([1, 0, 2]);
        expect(moveOrganizePage(original, 0, -1)).toBe(original);
    });

    it("moves dragged pages to drop slots using insert-before semantics", () => {
        expect(sourceIndexes(moveOrganizePageToDropSlot(pages([0, 1, 2, 3]), 1, 4))).toEqual([0, 2, 3, 1]);
        expect(sourceIndexes(moveOrganizePageToDropSlot(pages([0, 1, 2, 3]), 3, 1))).toEqual([0, 3, 1, 2]);
    });

    it("preserves the same reference for no-op drops and invalid deletes", () => {
        const original = pages([0, 1, 2]);

        expect(isNoOpOrganizeDrop(1, 2)).toBe(true);
        expect(moveOrganizePageToDropSlot(original, 1, 2)).toBe(original);
        expect(removeOrganizePage(original, 4)).toBe(original);
    });

    it("removes pages by current order index", () => {
        expect(sourceIndexes(removeOrganizePage(pages([0, 1, 2]), 1))).toEqual([0, 2]);
    });
});
