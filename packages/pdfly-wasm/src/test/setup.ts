import { beforeEach } from "vitest";
import { resetQpdfModule } from "../engines/qpdf/module-loader.js";
import { resetGhostscriptModule } from "../engines/ghostscript/module-loader.js";
import { resetGhostscriptRuntime } from "../engines/ghostscript/runtime.js";

beforeEach(() => {
    resetQpdfModule();
    resetGhostscriptModule();
    resetGhostscriptRuntime();
});
