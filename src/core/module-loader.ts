import { QpdfInitError } from './errors.js';
import type { QpdfWasmModule } from '../types/wasm-module.js';

let modulePromise: Promise<QpdfWasmModule> | null = null;
let moduleInstance: QpdfWasmModule | null = null;

// TODO: This is ugly

function normalizeModule(module: unknown): QpdfWasmModule {
  const normalized = module as QpdfWasmModule & {
    getQpdfVersion?: () => string;
    QPDF?: QpdfWasmModule['QPDFWrapper'];
  };

  if (typeof normalized.getVersion !== 'function' && typeof normalized.getQpdfVersion === 'function') {
    normalized.getVersion = normalized.getQpdfVersion.bind(normalized);
  }

  if (typeof normalized.QPDFWrapper !== 'function' && typeof normalized.QPDF === 'function') {
    normalized.QPDFWrapper = normalized.QPDF;
  }

  if (typeof normalized.getVersion !== 'function') {
    throw new TypeError('qpdf.js did not export getVersion/getQpdfVersion');
  }
  if (typeof normalized.compressPdf !== 'function') {
    throw new TypeError('qpdf.js did not export compressPdf');
  }
  if (typeof normalized.QPDFWrapper !== 'function') {
    throw new TypeError('qpdf.js did not export QPDF/QPDFWrapper');
  }
  if (typeof normalized.QPDFWriter !== 'function') {
    throw new TypeError('qpdf.js did not export QPDFWriter');
  }

  return normalized;
}

/**
 * Initialize the qpdf WASM module (singleton pattern)
 * Subsequent calls return the cached module instance
 */
export async function initQpdfModule(): Promise<QpdfWasmModule> {
  // Return cached instance if available
  if (moduleInstance) {
    return moduleInstance;
  }

  // Return in-flight promise if initialization is in progress
  if (modulePromise) {
    return modulePromise;
  }

  // Start initialization
  modulePromise = (async () => {
    try {
      // TODO: This is ugly, see how others do it
      // Load the generated Emscripten module at runtime.
      // Use a URL string so bundlers don't resolve this to src/core/qpdf.ts.
      const moduleUrl = new URL('./qpdf.js', import.meta.url).href;
      const imported = await import(/* @vite-ignore */ moduleUrl);
      const createQpdfModule =
        (imported as { default?: unknown; createQpdfModule?: unknown }).default ??
        (imported as { createQpdfModule?: unknown }).createQpdfModule;

      if (typeof createQpdfModule !== 'function') {
        throw new TypeError('qpdf.js did not export a module factory function');
      }

      // Call the factory function to create the module
      const module = normalizeModule(await createQpdfModule());

      moduleInstance = module;
      return module;
    } catch (error) {
      // Clear the promise so initialization can be retried
      modulePromise = null;

      throw new QpdfInitError(
        'Failed to initialize qpdf WASM module',
        { cause: error }
      );
    }
  })();

  return modulePromise;
}

/**
 * Reset the module instance (primarily for testing)
 */
export function resetModule(): void {
  moduleInstance = null;
  modulePromise = null;
}
