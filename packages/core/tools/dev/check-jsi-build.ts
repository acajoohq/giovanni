/**
 * JSI build artifact check
 *
 * Verifies that `pnpm build:jsi` produced the expected output files.
 * Run after `pnpm build:jsi`.
 *
 * Usage:  tsx tools/dev/check-jsi-build.ts
 */

import { existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..", "..");

const checks: Array<{ dir: string; file: string }> = [
    // qpdf JSI target (build:jsi:qpdf)
    { dir: resolve(packageRoot, "build", "jsi"), file: "libgiovanni_jsi.so" },
    { dir: resolve(packageRoot, "build", "jsi"), file: "qpdf_jsi.h" },
    // Ghostscript JSI target (build:jsi:gs)
    { dir: resolve(packageRoot, "build", "jsi-gs"), file: "libgiovanni_jsi_gs.so" },
    { dir: resolve(packageRoot, "build", "jsi-gs"), file: "gs_jsi.h" },
];

let allOk = true;

for (const { dir, file } of checks) {
    const fullPath = resolve(dir, file);
    if (!existsSync(fullPath)) {
        console.error(`MISSING: ${fullPath}`);
        allOk = false;
    } else {
        const { size } = statSync(fullPath);
        console.log(`OK (${(size / 1024).toFixed(1)} KB): ${file}`);
    }
}

if (!allOk) {
    console.error("\nJSI build check FAILED — run `pnpm build:jsi` first.");
    process.exit(1);
}

console.log("\nJSI build check PASSED.");