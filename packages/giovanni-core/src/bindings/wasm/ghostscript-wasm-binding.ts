import { withGhostscriptExecution } from "../../engines/ghostscript/execution.js";
import { initGhostscriptModule } from "../../engines/ghostscript/module-loader.js";
import type { GhostscriptBinding } from "../ghostscript-binding.interface.js";

export const ghostscriptWasmBinding: GhostscriptBinding = {
    async init(): Promise<void> {
        await initGhostscriptModule();
    },

    async getVersion(): Promise<string> {
        const module = await initGhostscriptModule();
        return module.getVersion();
    },

    async rewritePdf(input: Uint8Array, args: string[]): Promise<Uint8Array> {
        return withGhostscriptExecution(async (module) => module.rewritePdf(input, args).slice());
    },
};
