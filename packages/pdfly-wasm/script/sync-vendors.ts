import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rename, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as tar from "tar";
import { VENDOR_CONFIGS, type VendorName } from "./vendor-config.ts";

type SyncOptions = {
    refresh?: boolean;
};

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDirectory, "..");
const repoRoot = resolve(packageRoot, "..", "..");
const vendorRoot = resolve(repoRoot, "vendor");

export async function ensureVendors(vendors: VendorName[], options: SyncOptions = {}): Promise<void> {
    for (const vendor of vendors) {
        await ensureVendor(vendor, options);
    }
}

export async function ensureVendor(vendorName: VendorName, options: SyncOptions = {}): Promise<void> {
    const config = VENDOR_CONFIGS[vendorName];
    const destination = join(vendorRoot, config.directoryName);
    const currentVersion = await getExistingVendorVersion(destination, config.detectVersion);

    if (currentVersion === config.version && !options.refresh) {
        console.log(`✓ ${config.displayName} ${config.version} ready at ${relativeToRepo(destination)}`);
        return;
    }

    await mkdir(vendorRoot, { recursive: true });

    if (currentVersion && currentVersion !== config.version) {
        console.log(`Refreshing ${config.displayName}: found ${currentVersion}, expected ${config.version}`);
    } else if (options.refresh && currentVersion === config.version) {
        console.log(`Refreshing ${config.displayName} ${config.version}`);
    } else {
        console.log(`Downloading ${config.displayName} ${config.version}`);
    }

    const archiveBuffer = await downloadArchive(config.archiveUrl);
    verifySha256IfPresent(config.sha256, archiveBuffer, config.displayName);

    const archivePath = join(await mkdtemp(join(tmpdir(), `${config.directoryName}-archive-`)), `${config.directoryName}.tar.gz`);
    await writeFile(archivePath, archiveBuffer);

    const extractedDirectory = await mkdtemp(join(vendorRoot, `.${config.directoryName}-extract-`));
    await tar.x({
        cwd: extractedDirectory,
        file: archivePath,
        strip: 1,
    });

    const extractedVersion = await config.detectVersion(extractedDirectory);
    if (extractedVersion !== config.version) {
        throw new Error(
            `${config.displayName} archive version mismatch: expected ${config.version}, got ${extractedVersion ?? "unknown"}`
        );
    }

    await rm(destination, { recursive: true, force: true });
    await rename(extractedDirectory, destination);

    await writeFile(
        join(destination, ".pdfly-vendor.json"),
        JSON.stringify(
            {
                name: vendorName,
                version: config.version,
                archiveUrl: config.archiveUrl,
            },
            null,
            2
        )
    );

    console.log(`✓ ${config.displayName} ${config.version} installed at ${relativeToRepo(destination)}`);
}

async function getExistingVendorVersion(
    destination: string,
    detectVersion: (vendorRoot: string) => Promise<string | null>
): Promise<string | null> {
    try {
        const destinationStat = await stat(destination);
        if (!destinationStat.isDirectory()) {
            return null;
        }
    } catch {
        return null;
    }

    return detectVersion(destination);
}

async function downloadArchive(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download vendor archive: ${url} (${response.status} ${response.statusText})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

function verifySha256IfPresent(expectedSha256: string | undefined, contents: Buffer, displayName: string): void {
    if (!expectedSha256) {
        return;
    }

    const actualSha256 = createHash("sha256").update(contents).digest("hex");
    if (actualSha256 !== expectedSha256) {
        throw new Error(`${displayName} archive checksum mismatch: expected ${expectedSha256}, got ${actualSha256}`);
    }
}

function relativeToRepo(path: string): string {
    return path.startsWith(repoRoot) ? path.slice(repoRoot.length + 1) : path;
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const refresh = args.includes("--refresh");
    const vendorArgs = args.filter((arg) => arg !== "--refresh") as VendorName[];
    const vendors = vendorArgs.length > 0 ? vendorArgs : (Object.keys(VENDOR_CONFIGS) as VendorName[]);

    for (const vendor of vendors) {
        if (!(vendor in VENDOR_CONFIGS)) {
            throw new Error(`Unknown vendor: ${vendor}`);
        }
    }

    await ensureVendors(vendors, { refresh });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main();
}
