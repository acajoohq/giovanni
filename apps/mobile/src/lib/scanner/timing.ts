import type { ScanTiming } from '@/lib/scanner/scan.types';

export async function measureStep<T>(
  label: string,
  timings: ScanTiming[],
  task: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();

  try {
    return await task();
  } finally {
    timings.push({ label, ms: Date.now() - startedAt });
  }
}

export function totalTiming(timings: ScanTiming[]): number {
  return timings.reduce((sum, timing) => sum + timing.ms, 0);
}
