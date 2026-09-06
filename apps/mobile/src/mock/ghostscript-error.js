// Mock ghostscript error file to avoid dynamic import issues in giovanni-core
// Export the same error classes as the real file but as dummy classes
export class QpdfWatermarkError extends Error {}
export class GhostscriptInitError extends Error {}
export class QpdfInitError extends Error {}