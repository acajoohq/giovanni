import { initGhostscriptModule } from "./module-loader.js";
import type { GhostscriptWasmModule } from "../../types/wasm.types.js";

let executionQueue: Promise<void> = Promise.resolve();

export async function withGhostscriptExecution<T>(operation: (module: GhostscriptWasmModule) => Promise<T>): Promise<T> {
    return enqueue(async () => operation(await initGhostscriptModule()));
}

export function resetGhostscriptRuntime(): void {
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
