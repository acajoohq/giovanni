/**
 * Compares the @acajoo/giovanni-core package as it would be published from this
 * PR against the version currently published on npm, using the JSON output of
 * `npm pack --dry-run --json` for both sides.
 *
 * Writes a markdown table to:
 *   - test-report/bundle-size-summary.md
 *   - $GITHUB_STEP_SUMMARY (when running in GitHub Actions)
 *
 * Usage: tsx generate-bundle-size-summary.ts <pr.json> [published.json]
 */

import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type PackFile = { path: string; size: number };
type PackEntry = { name: string; version: string; size: number; unpackedSize: number; files: PackFile[] };

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const reportDir = resolve(toolsDirectory, "..", "..", "test-report");
const mdPath = resolve(reportDir, "bundle-size-summary.md");

// Order matters: first matching predicate wins. Bucketed by category rather than
// exact filename because tsdown content-hashes chunk names on every build, which
// would otherwise show every chunk as removed+added noise on each PR.
const CATEGORIES: Array<[string, (path: string) => boolean]> = [
    ["WebAssembly binaries", (p) => p.endsWith(".wasm")],
    ["Source maps", (p) => p.endsWith(".map")],
    ["Type declarations", (p) => p.endsWith(".d.mts") || p.endsWith(".d.cts")],
    ["JavaScript", (p) => p.endsWith(".js") || p.endsWith(".mjs") || p.endsWith(".cjs")],
    ["Other", () => true],
];

function fmtBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function fmtDelta(delta: number): string {
    if (delta === 0) return "±0 B ✅";
    const sign = delta > 0 ? "+" : "-";
    const icon = delta > 0 ? "⚠️" : "🟢";
    return `${sign}${fmtBytes(Math.abs(delta))} ${icon}`;
}

async function loadPack(path: string | undefined): Promise<PackEntry | null> {
    if (!path) return null;
    try {
        const raw = await readFile(path, "utf8");
        const data = JSON.parse(raw) as PackEntry[];
        return data[0] ?? null;
    } catch (error) {
        console.error(`Could not parse ${path}: ${(error as Error).message}`);
        return null;
    }
}

function bucketSizes(entry: PackEntry): Record<string, number> {
    const sizes = Object.fromEntries(CATEGORIES.map(([name]) => [name, 0]));
    for (const file of entry.files) {
        const category = CATEGORIES.find(([, matches]) => matches(file.path));
        const name = category ? category[0] : "Other";
        sizes[name] += file.size;
    }
    return sizes;
}

async function main(): Promise<void> {
    const [prPath, publishedPath] = process.argv.slice(2);
    const pr = await loadPack(prPath);
    if (!pr) {
        console.error(`No PR pack data found at ${prPath}, skipping bundle size summary.`);
        return;
    }

    const published = await loadPack(publishedPath);
    const prSizes = bucketSizes(pr);

    const lines = ["## 📦 Bundle Size (`@acajoo/giovanni-core`)\n"];

    if (!published) {
        lines.push("> ℹ️ No published npm baseline available (package not yet published, or fetch failed)\n");
        lines.push("| Category | This PR |");
        lines.push("|----------|---------|");
        for (const [name] of CATEGORIES) {
            lines.push(`| ${name} | ${fmtBytes(prSizes[name])} |`);
        }
        lines.push(`| **Total (unpacked)** | **${fmtBytes(pr.unpackedSize)}** |`);
        lines.push(`| **Total (packed tarball)** | **${fmtBytes(pr.size)}** |`);
    } else {
        const publishedSizes = bucketSizes(published);
        const npmUrl = `https://www.npmjs.com/package/${published.name}/v/${published.version}`;
        lines.push(`Comparing against [\`${published.name}@${published.version}\`](${npmUrl}) currently on npm.\n`);
        lines.push("| Category | Published | This PR | Δ |");
        lines.push("|----------|-----------|---------|---|");
        for (const [name] of CATEGORIES) {
            const pub = publishedSizes[name];
            const prV = prSizes[name];
            lines.push(`| ${name} | ${fmtBytes(pub)} | ${fmtBytes(prV)} | ${fmtDelta(prV - pub)} |`);
        }
        lines.push(`| **Total (unpacked)** | **${fmtBytes(published.unpackedSize)}** | **${fmtBytes(pr.unpackedSize)}** | ${fmtDelta(pr.unpackedSize - published.unpackedSize)} |`);
        lines.push(`| **Total (packed tarball)** | **${fmtBytes(published.size)}** | **${fmtBytes(pr.size)}** | ${fmtDelta(pr.size - published.size)} |`);
    }

    const content = `${lines.join("\n")}\n`;

    await mkdir(reportDir, { recursive: true });
    await writeFile(mdPath, content, "utf8");
    console.log(`Written ${mdPath}`);

    const stepSummary = process.env.GITHUB_STEP_SUMMARY;
    if (stepSummary) {
        await appendFile(stepSummary, content, "utf8");
        console.log("Appended to $GITHUB_STEP_SUMMARY");
    }
}

await main();
