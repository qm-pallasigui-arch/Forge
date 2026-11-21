export function normalizeWeight(value: number): number {
  return Number.isFinite(value) ? Math.min(999, Math.max(0, Math.round(value * 2) / 2)) : 0;
}
export function plateChange(weight: number, plate: number, remove: boolean): number {
  return normalizeWeight(weight + (remove ? -1 : 1) * plate * 2);
}
