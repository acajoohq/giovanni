import { QpdfInitError } from './errors.js';
import type { QpdfWasmModule } from '../types/wasm-module.js';

let modulePromise: Promise<QpdfWasmModule> | null = null;
let moduleInstance: QpdfWasmModule | null = null;

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
      // Dynamic import of the generated qpdf.js file
      // The path will be resolved relative to the bundled output
      const createQpdfModule = await import('../qpdf.js' as string);

      // Call the factory function to create the module
      const module = await createQpdfModule.default();

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
