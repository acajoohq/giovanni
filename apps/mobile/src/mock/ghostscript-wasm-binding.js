// Mock ghostscript WASM binding to avoid dynamic import during bundling
// This mock throws an error if used, indicating that the JSI binding should have been set
export const ghostscriptWasmBinding = {
  init: () => { throw new Error('Mock ghostscriptWasmBinding used. JSI binding should be set in initGiovanniBindings.tsx'); },
  getVersion: () => { throw new Error('Mock ghostscriptWasmBinding used. JSI binding should be set in initGiovanniBindings.tsx'); },
  rewritePdf: (input, args) => { throw new Error('Mock ghostscriptWasmBinding used. JSI binding should be set in initGiovanniBindings.tsx'); }
};