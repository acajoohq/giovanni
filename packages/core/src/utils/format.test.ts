import { describe, it, expect } from "vitest";
import { calculateSavings, formatBytes, formatPercentage } from "./format.js";

describe("Format Utilities", () => {
    describe("formatBytes", () => {
        it("should format zero bytes", () => {
            expect(formatBytes(0)).toBe("0 Bytes");
        });

        it("should format bytes", () => {
            expect(formatBytes(500)).toBe("500 Bytes");
        });

        it("should format kilobytes", () => {
            expect(formatBytes(1024)).toBe("1 KB");
            expect(formatBytes(1536)).toBe("1.5 KB");
        });

        it("should format megabytes", () => {
            expect(formatBytes(1048576)).toBe("1 MB");
            expect(formatBytes(2621440)).toBe("2.5 MB");
        });

        it("should respect decimals parameter", () => {
            expect(formatBytes(1536, 0)).toBe("2 KB");
            expect(formatBytes(1536, 3)).toBe("1.5 KB");
        });
    });

    describe("calculateSavings", () => {
        it("should calculate savings correctly", () => {
            const result = calculateSavings(1000, 500);
            expect(result.savedBytes).toBe(500);
            expect(result.compressionRatio).toBe(0.5);
            expect(result.percentageSaved).toBe(50);
        });

        it("should handle no savings", () => {
            const result = calculateSavings(1000, 1000);
            expect(result.savedBytes).toBe(0);
            expect(result.compressionRatio).toBe(1);
            expect(result.percentageSaved).toBe(0);
        });

        it("should handle size increase", () => {
            const result = calculateSavings(1000, 1200);
            expect(result.savedBytes).toBe(-200);
            expect(result.compressionRatio).toBe(1.2);
            expect(result.percentageSaved).toBe(-20);
        });
    });

    describe("formatPercentage", () => {
        it("should format positive percentages with sign", () => {
            expect(formatPercentage(25.5)).toBe("+25.5%");
        });

        it("should format negative percentages", () => {
            expect(formatPercentage(-10.2)).toBe("-10.2%");
        });

        it("should format zero", () => {
            expect(formatPercentage(0)).toBe("+0.0%");
        });

        it("should respect decimals parameter", () => {
            expect(formatPercentage(25.555, 2)).toBe("+25.56%");
        });
    });
});
