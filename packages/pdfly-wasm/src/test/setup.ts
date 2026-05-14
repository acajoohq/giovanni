import { beforeEach } from "vitest";
import { resetQpdfModule } from "../core/qpdf/module-loader.js";
import { resetGhostscriptModule } from "../core/ghostscript/module-loader.js";
import { resetGhostscriptRuntime } from "../core/ghostscript/runtime.js";

beforeEach(() => {
    resetQpdfModule();
    resetGhostscriptModule();
    resetGhostscriptRuntime();
});
