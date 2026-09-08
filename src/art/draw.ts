export const ink = '#202125';
export const palette = {
  lime: '#d5fa43',
  pink: '#f995c5',
  orange: '#ff7955',
  blue: '#9acbe7',
  cream: '#fff9e9',
  ink,
};
export function box(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  radius = 12,
  stroke = 4,
): void {
  c.beginPath();
  c.roundRect(x, y, w, h, radius);
  c.fillStyle = color;
  c.fill();
  if (stroke) {
    c.lineWidth = stroke;
    c.strokeStyle = ink;
    c.stroke();
  }
}
export function line(c: CanvasRenderingContext2D, points: number[], color = ink, width = 4): void {
  c.beginPath();
  c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.stroke();
}
export function ellipse(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  stroke = 0,
): void {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
  if (stroke) {
    c.lineWidth = stroke;
    c.strokeStyle = ink;
    c.stroke();
  }
}
export function text(
  c: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size = 22,
  color = ink,
  align: CanvasTextAlign = 'center',
): void {
  c.font = `900 ${size}px 'Arial', sans-serif`;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(value, x, y);
}
export function sticker(
  c: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  width = 190,
  color = palette.lime,
): void {
  box(c, x - width / 2 + 4, y - 23 + 5, width, 46, ink, 5, 0);
  box(c, x - width / 2, y - 23, width, 46, color, 5, 3);
  text(c, value, x, y, 18);
}
export function character(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
  mood: 'idle' | 'happy' | 'dead' | 'panic' = 'idle',
  time = 0,
): void {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const bounce = Math.sin(time * 5) * 3;
  ellipse(c, 0, 83, 51, 10, '#20212525');
  c.translate(0, bounce);
  line(c, [-23, 52, -29, 77, -44, 77], ink, 9);
  line(c, [24, 52, 31, 77, 46, 77], ink, 9);
  line(c, [-44, -3, -65, mood === 'happy' ? -50 : 21, -75, mood === 'happy' ? -43 : 12], ink, 8);
  line(c, [44, -3, 65, mood === 'happy' ? -50 : 21, 75, mood === 'happy' ? -43 : 12], ink, 8);
  box(c, -47, -73, 94, 133, palette.orange, 29, 5);
  c.save();
  c.beginPath();
  c.roundRect(-45, -71, 90, 129, 27);
  c.clip();
  c.fillStyle = '#dd503d';
  c.beginPath();
  c.moveTo(25, -73);
  c.lineTo(48, -73);
  c.lineTo(48, 65);
  c.lineTo(-5, 65);
  c.closePath();
  c.fill();
  c.restore();
  line(c, [-18, -70, -13, -92, 4, -77, 13, -87], ink, 5);
  if (mood === 'dead') {
    for (const a of [-19, 20]) {
      line(c, [a - 7, -31, a + 7, -17]);
      line(c, [a + 7, -31, a - 7, -17]);
    }
  } else {
    ellipse(c, -19, -25, 12, 17, '#fff9e9', 3);
    ellipse(c, 20, -25, 12, 17, '#fff9e9', 3);
    ellipse(c, -16, -22, 4, 6, ink);
    ellipse(c, 17, -22, 4, 6, ink);
  }
  if (mood === 'panic') ellipse(c, 0, 12, 10, 15, ink);
  else if (mood === 'happy') {
    c.beginPath();
    c.arc(0, 3, 16, 0, Math.PI);
    c.fillStyle = ink;
    c.fill();
  } else line(c, [-13, 10, -2, 6, 10, 13, 18, 9], ink, 4);
  box(c, -28, 32, 55, 13, palette.cream, 3, 2);
  text(c, 'TEMP', 0, 39, 10);
  c.restore();
}
export function room(c: CanvasRenderingContext2D, background: string, floor: string): void {
  c.fillStyle = background;
  c.fillRect(0, 0, 960, 540);
  c.fillStyle = floor;
  c.fillRect(0, 389, 960, 151);
  line(c, [0, 389, 960, 389]);
  for (let x = -200; x < 1200; x += 180)
    line(c, [480 + (x - 480) * 0.8, 389, x, 540], '#20212518', 2);
  line(c, [0, 465, 960, 465], '#20212518', 2);
}
export function button(
  c: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  w = 170,
  color = palette.lime,
): void {
  box(c, x + 4, y + 5, w, 54, ink, 10, 0);
  box(c, x, y, w, 54, color, 10, 3);
  text(c, label, x + w / 2, y + 27, 19);
}
export function hit(x: number, y: number, bx: number, by: number, w: number, h: number): boolean {
  return x >= bx && x <= bx + w && y >= by && y <= by + h;
}
export function burst(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
  color = palette.lime,
): void {
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const r = 20 + progress * 130;
    c.save();
    c.translate(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
    c.rotate(angle + progress * 4);
    c.globalAlpha = Math.max(0, 1 - progress);
    box(c, -5, -5, 10, 10, color, 1, 0);
    c.restore();
  }
}
