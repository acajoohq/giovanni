import { defineConfig } from 'tsdown';
import { copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  minify: false,
  sourcemap: true,
  onSuccess: async () => {
    // Copy WASM artifacts to dist/
    const wasmFiles = [
      { src: 'build/wasm/qpdf.wasm', dest: 'dist/qpdf.wasm' },
      { src: 'build/wasm/qpdf.js', dest: 'dist/qpdf.js' }
    ];

    // Ensure dist directory exists
    if (!existsSync('dist')) {
      await mkdir('dist', { recursive: true });
    }

    for (const { src, dest } of wasmFiles) {
      if (existsSync(src)) {
        await copyFile(src, dest);
        console.log(`✓ Copied ${src} → ${dest}`);
      } else {
        console.warn(`⚠ Warning: ${src} not found, skipping copy`);
      }
    }
  }
});
