import { withGhostscriptModule } from "./module-loader.js";
import type { GhostscriptWasmModule } from "../../types/wasm-module.js";

let operationCounter = 0;
let executionQueue: Promise<void> = Promise.resolve();

export async function withGhostscriptExecution<T>(
    capture: GhostscriptLogCapture,
    operation: (module: GhostscriptWasmModule) => Promise<T>
): Promise<T> {
    return enqueue(async () =>
        withGhostscriptModule(capture, async (module) => {
            return operation(module);
        }),
    );
}

export function nextGhostscriptMemfsPath(prefix: string): string {
    operationCounter += 1;
    return `/${prefix}-${operationCounter}.pdf`;
}

export function cleanupGhostscriptMemfsFile(fs: { unlink?(path: string): void }, path: string): void {
    try {
        fs.unlink?.(path);
    } catch {
        // ignore cleanup failures; these should not mask the real operation result
    }
}

export interface GhostscriptLogCapture {
    stdout: string[];
    stderr: string[];
}

export function resetGhostscriptRuntime(): void {
    operationCounter = 0;
    executionQueue = Promise.resolve();
}

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const run = executionQueue.then(operation, operation);
    executionQueue = run.then(
        () => undefined,
        () => undefined,
    );
    return run;
}
