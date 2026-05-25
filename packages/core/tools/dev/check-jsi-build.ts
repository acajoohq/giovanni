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

const jsiBuildDir = resolve(packageRoot, "build", "jsi");

const expectedFiles = [
    // Shared library (exact name varies by platform)
    ...(process.platform === "win32"
        ? ["pdfly_jsi.dll"]
        : process.platform === "darwin"
          ? ["libpdfly_jsi.dylib"]
          : ["libpdfly_jsi.so"]),
    // Public header copied by build-native.ts
    "qpdf_jsi.h",
];

let allOk = true;

for (const file of expectedFiles) {
    const fullPath = resolve(jsiBuildDir, file);
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
