export interface WasmSingletonLoader<T> {
    init(): Promise<T>;
    reset(): void;
}

export interface EmscriptenModuleLoadOptions<TModule, TModuleOptions = undefined> {
    resolveFrom: string;
    moduleFileName: string;
    exportNames?: string[];
    createModuleOptions?: (moduleUrl: string) => TModuleOptions;
    normalizeModule?: (module: unknown) => TModule;
    createInitError: (error: unknown) => Error;
}

export function createSingletonWasmLoader<T>(factory: () => Promise<T>): WasmSingletonLoader<T> {
    let modulePromise: Promise<T> | null = null;
    let moduleInstance: T | null = null;

    return {
        async init(): Promise<T> {
            if (moduleInstance) {
                return moduleInstance;
            }

            if (modulePromise) {
                return modulePromise;
            }

            modulePromise = (async () => {
                try {
                    const module = await factory();
                    moduleInstance = module;
                    return module;
                } catch (error) {
                    modulePromise = null;
                    throw error;
                }
            })();

            return modulePromise;
        },
        reset(): void {
            moduleInstance = null;
            modulePromise = null;
        },
    };
}

export function createSingletonEmscriptenModuleLoader<TModule, TModuleOptions = undefined>(
    options: EmscriptenModuleLoadOptions<TModule, TModuleOptions>
): WasmSingletonLoader<TModule> {
    return createSingletonWasmLoader(async () => {
        try {
            const moduleUrl = new URL(options.moduleFileName, options.resolveFrom).href;
            const imported = await import(/* @vite-ignore */ moduleUrl);
            const createModule = resolveModuleFactory<TModuleOptions>(imported, options.exportNames);

            const module =
                options.createModuleOptions === undefined
                    ? await createModule()
                    : await createModule(options.createModuleOptions(moduleUrl));

            return options.normalizeModule ? options.normalizeModule(module) : (module as TModule);
        } catch (error) {
            throw options.createInitError(error);
        }
    });
}

type MaybePromise<T> = T | Promise<T>;

type ModuleFactory<TOptions> = (...args: [] | [TOptions]) => MaybePromise<unknown>;

function resolveModuleFactory<TOptions>(imported: unknown, exportNames = ["default"]): ModuleFactory<TOptions> {
    const moduleRecord = imported as Record<string, unknown>;

    for (const exportName of exportNames) {
        const candidate = moduleRecord[exportName];
        if (typeof candidate === "function") {
            return candidate as ModuleFactory<TOptions>;
        }
    }

    throw new TypeError(`WASM module did not export a factory function (${exportNames.join(", ")})`);
}
