import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, "..");
const cmd = process.platform === "win32" ? "powershell .\\wasm\\build.ps1" : "bash wasm/build.sh";

execSync(cmd, { stdio: "inherit", cwd: packageRoot });
