export interface ResolveProgressOptions {
  progressInput: string;
  pageTo?: number;
  totalPages?: number;
  previousProgress?: number;
  done?: boolean;
}

export function parseOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function resolveProgress({
  progressInput,
  pageTo,
  totalPages,
  previousProgress,
  done = false
}: ResolveProgressOptions): number | undefined {
  if (done) return 1;

  if (progressInput.trim() !== '') {
    const percent = Number(progressInput);
    if (Number.isFinite(percent)) return Math.min(1, Math.max(0, percent / 100));
  }

  if (pageTo !== undefined && totalPages !== undefined && totalPages > 0) {
    return Math.min(1, Math.max(0, pageTo / totalPages));
  }

  return previousProgress;
}
