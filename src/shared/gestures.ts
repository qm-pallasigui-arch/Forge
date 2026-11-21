import { PanResponder } from "react-native";
type Rotation = { depth: boolean; angle?: number; onAngle?: (angle: number) => void; onRotateStart?: () => void };
// Responders retain gesture-local state; callbacks are refreshed after React commits.
export function createBodyGesture(initial: Rotation) {
  let latest = initial, start = 0, dragging = false;
  const finish = () => { setTimeout(() => { dragging = false; }, 0); };
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, move) => latest.depth && Math.abs(move.dx) > 8 && Math.abs(move.dx) > Math.abs(move.dy),
    onPanResponderGrant: () => { dragging = true; start = latest.angle ?? 0; latest.onRotateStart?.(); },
    onPanResponderMove: (_, move) => latest.onAngle?.(start + move.dx * 0.7),
    onPanResponderRelease: finish,
    onPanResponderTerminate: finish,
  });
  return { handlers: responder.panHandlers, update: (value: Rotation) => { latest = value; }, isDragging: () => dragging };
}
export function createSwipeGesture() {
  let onStart = () => {}, onRemove = () => {};
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, move) => move.dx < -18 && Math.abs(move.dx) > Math.abs(move.dy) * 1.5,
    onPanResponderGrant: () => onStart(),
    onPanResponderRelease: (_, move) => { if (move.dx < -90) onRemove(); },
  });
  return { handlers: responder.panHandlers, update: (start: () => void, remove: () => void) => { onStart = start; onRemove = remove; } };
}
