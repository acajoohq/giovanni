// TODO: use modern web apis instead

/**
 * Format bytes as human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Calculate compression savings
 */
export function calculateSavings(original: number, compressed: number): {
  savedBytes: number;
  compressionRatio: number;
  percentageSaved: number;
} {
  const savedBytes = original - compressed;
  const compressionRatio = compressed / original;
  const percentageSaved = (savedBytes / original) * 100;

  return {
    savedBytes,
    compressionRatio,
    percentageSaved,
  };
}

/**
 * Format percentage with sign
 */
export function formatPercentage(value: number, decimals = 1): string {
  const factor = 10 ** decimals;
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  const sign = rounded >= 0 ? '+' : '';
  return `${sign}${rounded.toFixed(decimals)}%`;
}
