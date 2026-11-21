export const STEPS = ["rotate", "select", "add", "routine", "weight"] as const;
export type GuideStep = typeof STEPS[number];
export type GuideState = { completed: GuideStep[]; paused: boolean; dismissed: boolean; unlocked: boolean; hints: string[] };
export const newGuide = (): GuideState => ({ completed: [], paused: false, dismissed: false, unlocked: false, hints: [] });
export function parseGuide(raw: string | null): GuideState {
  try {
    const value = raw ? JSON.parse(raw) : null;
    if (!value || typeof value !== "object") return newGuide();
    return { completed: STEPS.filter((step) => value.completed?.includes?.(step)), paused: value.paused === true, dismissed: value.dismissed === true, unlocked: value.unlocked === true, hints: Array.isArray(value.hints) ? value.hints.filter((hint: unknown) => typeof hint === "string") : [] };
  } catch { return newGuide(); }
}
export function completeStep(state: GuideState, step: GuideStep): GuideState {
  if (state.completed.includes(step) && (step !== "add" || state.unlocked)) return state;
  return { ...state, completed: [...new Set([...state.completed, step])], unlocked: state.unlocked || step === "add" };
}
export const nextStep = (state: GuideState) => STEPS.find((step) => !state.completed.includes(step));
