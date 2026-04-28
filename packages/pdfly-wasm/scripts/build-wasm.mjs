import { execSync } from "node:child_process";

const cmd = process.platform === "win32" ? "powershell .\\wasm\\build.ps1" : "bash wasm/build.sh";

execSync(cmd, { stdio: "inherit" });
