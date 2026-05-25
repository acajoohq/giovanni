import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDirectory, "..", "..");

await Promise.all([rm(resolve(packageRoot, "dist"), { recursive: true, force: true }), rm(resolve(packageRoot, "build"), { recursive: true, force: true })]);
