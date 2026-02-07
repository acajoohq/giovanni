import { beforeEach } from 'vitest';
import { resetModule } from '../src/core/module-loader.js';

// Reset WASM module before each test to ensure isolation
beforeEach(() => {
  resetModule();
});
