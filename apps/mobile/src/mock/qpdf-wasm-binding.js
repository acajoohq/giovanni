// Mock qpdf WASM binding to avoid dynamic import during bundling
// This mock throws an error if used, indicating that the JSI binding should have been set
export const qpdfWasmBinding = {
  init: () => { throw new Error('Mock qpdfWasmBinding used. JSI binding should be set in initGiovanniBindings.tsx'); },
  getVersion: () => { throw new Error('Mock qpdfWasmBinding used. JSI binding should be set in initGiovanniBindings.tsx'); },
  writePdf: (data, options, password) => { throw new Error('Mock qpdfWasmBinding used. JSI binding should be set in initGiovanniBindings.tsx'); },
  splitPages: (data) => { throw new Error('Mock qpdfWasmBinding used. JSI binding should be set in initGiovanniBindings.tsx'); },
  mergePdfs: (inputs) => { throw new Error('Mock qpdfWasmBinding used. JSI binding should be set in initGiovanniBindings.tsx'); },
  getDocumentInfo: (data, password) => { throw new Error('Mock qpdfWasmBinding used. JSI binding should be set in initGiovanniBindings.tsx'); },
  extractImages: (data) => { throw new Error('Mock qpdfWasmBinding used. JSI binding should be set in initGiovanniBindings.tsx'); },
  watermarkPdf: (data, watermark, options, password, watermarkPassword) => { throw new Error('Mock qpdfWasmBinding used. JSI binding should be set in initGiovanniBindings.tsx') }
};