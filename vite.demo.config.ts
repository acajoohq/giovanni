import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

function copyWasmForDemo(): Plugin {
  return {
    name: 'copy-qpdf-wasm-for-demo',
    apply: 'build',
    async closeBundle() {
      const source = resolve(rootDir, 'dist/qpdf.wasm');
      const target = resolve(rootDir, 'demo-dist/assets/qpdf.wasm');

      if (!existsSync(source)) {
        throw new Error(
          'Missing dist/qpdf.wasm. Run `npm run build` before `npm run demo:build`.'
        );
      }

      await mkdir(dirname(target), { recursive: true });
      await copyFile(source, target);
    },
  };
}

export default defineConfig({
  root: 'demo',
  base: './',
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
  },
  plugins: [copyWasmForDemo()],
});
