/**
 * Reads test-report/compression-results.xml and writes a markdown summary to:
 *   - test-report/compression-summary.md
 *   - $GITHUB_STEP_SUMMARY (when running in GitHub Actions)
 *
 * Optional --baseline <path> compares current results against a previous XML file
 * and shows regression indicators in the table.
 *
 * Usage: tsx generate-compression-summary.ts [--baseline <path>]
 */

import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const toolsDirectory = dirname(fileURLToPath(import.meta.url));
const reportDir = resolve(toolsDirectory, "..", "..", "test-report");
const xmlPath = resolve(reportDir, "compression-results.xml");
const mdPath = resolve(reportDir, "compression-summary.md");

const SCENARIOS: Array<[string, string]> = [
    ["simple-recommended", "Recommended"],
    ["simple-smallest", "Smallest file"],
    ["simple-best-quality", "Best quality"],
    ["combined-balanced", "Combined"],
];

function fmtBytes(b: number): string {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

function getAttr(tag: string, attr: string): string | undefined {
    return tag.match(new RegExp(`${attr}="([^"]*)"`))?.at(1);
}

type ResultEntry = { compressedBytes: number; percentageSaved: number } | { status: "wasm-abort" };
type FileEntry = { name: string; originalBytes: number; results: Map<string, ResultEntry> };

function parseXml(xml: string): FileEntry[] {
    const files: FileEntry[] = [];
    const fileRegex = /<file([^>]*)>([\s\S]*?)<\/file>/g;
    const resultRegex = /<result([^>]*?)\/>/g;

    let fileMatch: RegExpExecArray | null;
    while ((fileMatch = fileRegex.exec(xml)) !== null) {
        const name = getAttr(fileMatch[1], "name") ?? "";
        const originalBytes = parseInt(getAttr(fileMatch[1], "originalBytes") ?? "0", 10);
        const results = new Map<string, ResultEntry>();

        let resultMatch: RegExpExecArray | null;
        while ((resultMatch = resultRegex.exec(fileMatch[2])) !== null) {
            const attrs = resultMatch[1];
            const scenario = getAttr(attrs, "scenario") ?? getAttr(attrs, "preset") ?? "";
            if (getAttr(attrs, "status") === "wasm-abort") {
                results.set(scenario, { status: "wasm-abort" });
            } else {
                results.set(scenario, {
                    compressedBytes: parseInt(getAttr(attrs, "compressedBytes") ?? "0", 10),
                    percentageSaved: parseFloat(getAttr(attrs, "percentageSaved") ?? "0"),
                });
            }
        }

        files.push({ name, originalBytes, results });
    }
    return files;
}

async function loadXml(path: string): Promise<FileEntry[] | null> {
    try {
        const xml = await readFile(path, "utf8");
        return parseXml(xml);
    } catch {
        return null;
    }
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const baselineIdx = args.indexOf("--baseline");
    const baselinePath = baselineIdx !== -1 ? args[baselineIdx + 1] : undefined;

    if (!existsSync(xmlPath)) {
        console.error(`No report found at ${xmlPath}, skipping summary.`);
        return;
    }

    const files = await loadXml(xmlPath);
    if (!files) {
        console.error(`Failed to parse ${xmlPath}`);
        return;
    }

    const baselineFiles = baselinePath ? await loadXml(baselinePath) : null;
    const baseline = new Map<string, ResultEntry>();
    if (baselineFiles) {
        for (const f of baselineFiles) {
            for (const [scenario, result] of f.results) {
                baseline.set(`${f.name}::${scenario}`, result);
            }
        }
    }

    const hasBaseline = baselineFiles !== null;
    let hasChanges = !hasBaseline;

    const title = `## Compression Results${hasBaseline ? " (vs master)" : ""}`;
    const noBaselineNote = hasBaseline ? "" : "\n> ℹ️ No master baseline available\n";
    const scenarioHeader = SCENARIOS.map(([, label]) => label).join(" | ");
    const scenarioSeparator = SCENARIOS.map(([, label]) => "-".repeat(label.length + 2)).join("|");

    const lines = [
        `${title}\n`,
        `| File | Original | ${scenarioHeader} |`,
        `|------|----------|${scenarioSeparator}|`,
    ];

    for (const file of files) {
        const orig = fmtBytes(file.originalBytes);
        const cells: string[] = [];

        for (const [scenario] of SCENARIOS) {
            const r = file.results.get(scenario);
            if (r === undefined) {
                cells.push("—");
            } else if ("status" in r) {
                cells.push("⚠️ skip");
            } else {
                const { compressedBytes: cb, percentageSaved: pct } = r;
                const sign = pct > 0 ? "-" : "+";
                let cell = `${fmtBytes(cb)} (${sign}${Math.abs(pct).toFixed(1)}%)`;

                if (hasBaseline) {
                    const base = baseline.get(`${file.name}::${scenario}`);
                    if (base === undefined) {
                        cell += " 🆕";
                        hasChanges = true;
                    } else if ("status" in base) {
                        cell += " 🟢"; // was failing, now works
                        hasChanges = true;
                    } else {
                        const delta = cb - base.compressedBytes;
                        if (delta === 0) {
                            cell += " ✅";
                        } else if (delta > 0) {
                            cell += ` ⚠️ (+${fmtBytes(delta)})`;
                            hasChanges = true;
                        } else {
                            cell += ` 🟢 (-${fmtBytes(Math.abs(delta))})`;
                            hasChanges = true;
                        }
                    }
                }

                cells.push(cell);
            }
        }

        lines.push(`| ${file.name} | ${orig} | ${cells.join(" | ")} |`);
    }

    if (hasBaseline) {
        lines.push("\n> ✅ unchanged &nbsp;|&nbsp; 🟢 improved &nbsp;|&nbsp; ⚠️ regression &nbsp;|&nbsp; 🆕 new fixture");
    }

    const content = noBaselineNote + lines.join("\n") + "\n";

    await mkdir(reportDir, { recursive: true });

    const stepSummary = process.env.GITHUB_STEP_SUMMARY;
    if (stepSummary) {
        await appendFile(stepSummary, content, "utf8");
        console.log("Appended to $GITHUB_STEP_SUMMARY");
    }

    if (hasChanges) {
        await writeFile(mdPath, content, "utf8");
        console.log(`Written ${mdPath}`);
    } else {
        console.log("No compression changes detected — skipping PR comment.");
    }
}

await main();
