export const sideAtAngle = (angle: number): "front" | "back" => Math.cos(angle * Math.PI / 180) >= 0 ? "front" : "back";
export function projectAnchor(x: number, y: number, width: number, height: number, angle: number, zoom = 1, shiftX = 0, shiftY = 0) {
  const scale = Math.min(width / 350, height / 900);
  const localX = (x - 287) * scale, localY = (y - 510) * scale;
  const radians = angle * Math.PI / 180;
  const display = sideAtAngle(angle) === "back" ? radians + Math.PI : radians;
  const perspective = 1000 / (1000 + localX * Math.sin(display));
  return { x: width / 2 + localX * Math.cos(display) * perspective * zoom + shiftX, y: height / 2 + localY * perspective * zoom + shiftY };
}
export function focusCamera(x: number, y: number, width: number, height: number, angle: number) {
  const point = projectAnchor(x, y, width, height, angle, 1.45);
  return { zoom: 1.45, x: width / 2 - point.x, y: height * (y >= 490 ? 0.64 : 0.3) - point.y };
}
export function placeCard(pinY: number, height: number, lower: boolean, expanded: boolean) {
  const gap = 24, availableAbove = pinY - gap, availableBelow = height - pinY - gap;
  const below = lower ? availableAbove < 210 && availableBelow > availableAbove : !(availableBelow < 210 && availableAbove > availableBelow);
  const available = Math.max(0, below ? availableBelow : availableAbove);
  const cardHeight = Math.min(height, expanded ? Math.max(210, height * 0.78) : Math.max(180, Math.min(210, available)));
  return { top: Math.max(0, Math.min(height - cardHeight, below ? pinY + gap : pinY - gap - cardHeight)), height: cardHeight, below };
}
