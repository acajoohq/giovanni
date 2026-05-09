import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, "..");
const wasmDir = join(packageRoot, "build", "wasm");
const wasmFile = join(wasmDir, "qpdf.wasm");
const jsFile = join(wasmDir, "qpdf.js");

if (!process.env.FORCE_WASM_BUILD && existsSync(wasmFile) && existsSync(jsFile)) {
    console.log("WASM artifacts already exist, skipping build. Set FORCE_WASM_BUILD=1 to force a rebuild.");
    process.exit(0);
}

const cmd = process.platform === "win32" ? "powershell .\\wasm\\build.ps1" : "bash wasm/build.sh";

execSync(cmd, { stdio: "inherit", cwd: packageRoot });
