export interface Layout {
  left: number;
  top: number;
  scale: number;
  rotated: boolean;
}
export function layoutFor(width: number, height: number, rotate: boolean): Layout {
  const rotated = rotate && height > width;
  const scale = Math.min((rotated ? height : width) / 960, (rotated ? width : height) / 540);
  return {
    left: (width - (rotated ? 540 : 960) * scale) / 2,
    top: (height - (rotated ? 960 : 540) * scale) / 2,
    scale,
    rotated,
  };
}
export function logicalPoint(x: number, y: number, layout: Layout): { x: number; y: number } {
  return layout.rotated
    ? { x: (y - layout.top) / layout.scale, y: 540 - (x - layout.left) / layout.scale }
    : { x: (x - layout.left) / layout.scale, y: (y - layout.top) / layout.scale };
}
export class Viewport {
  layout: Layout = { left: 0, top: 0, scale: 1, rotated: false };
  constructor(private element: HTMLElement) {
    window.addEventListener('resize', this.resize);
    window.visualViewport?.addEventListener('resize', this.resize);
    this.resize();
  }
  resize = (): void => {
    const safe = getComputedStyle(document.querySelector('#safe-area')!);
    const l = parseFloat(safe.paddingLeft),
      r = parseFloat(safe.paddingRight),
      t = parseFloat(safe.paddingTop),
      b = parseFloat(safe.paddingBottom);
    const width = window.visualViewport?.width ?? innerWidth;
    const height = window.visualViewport?.height ?? innerHeight;
    this.layout = layoutFor(
      width - l - r,
      height - t - b,
      matchMedia('(pointer: coarse)').matches || width < 600,
    );
    this.layout.left += l;
    this.layout.top += t;
    this.element.classList.toggle('compact', this.layout.scale < 0.85);
    const { left, top, scale, rotated } = this.layout;
    this.element.style.transform = rotated
      ? `translate(${left + 540 * scale}px, ${top}px) rotate(90deg) scale(${scale})`
      : `translate(${left}px, ${top}px) scale(${scale})`;
  };
}
