import { parseState, type State } from "../state/persistence";
export const BACKUP_LIMIT = 5 * 1024 * 1024;
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
}
export function exportBackup(state: State) { return JSON.stringify({ app: "FitMap", version: 1, exportedAt: new Date().toISOString(), state }, null, 2); }
export function importBackup(text: string): State {
  if (text.length > BACKUP_LIMIT) throw new Error("Backup exceeds the 5 MB limit.");
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("This file is not valid JSON."); }
  if (data?.app !== "FitMap" || data.version !== 1 || !data.state || typeof data.state !== "object") throw new Error("Choose a FitMap version 1 backup.");
  const state = parseState(JSON.stringify(data.state));
  for (const key of Object.keys(state) as (keyof State)[]) {
    if (key === "lastLog" && data.state.lastLog === undefined) continue;
    if (canonical(state[key]) !== canonical(data.state[key])) throw new Error(`Backup has invalid or missing ${key} data. Nothing was imported.`);
  }
  if (state.routine.length > 200 || new Set(state.routine.map((e) => e.id)).size !== state.routine.length || state.routine.some((e) => !Number.isInteger(e.sets) || e.sets > 100 || !Number.isInteger(e.reps))) throw new Error("Backup contains invalid exercise counts or duplicate exercises.");
  return state;
}
