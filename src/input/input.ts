import type { Action, GameInput } from '../core/types';
import { logicalPoint, type Viewport } from './viewport';
const keys: Record<string, Action> = {
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ' ': 'confirm',
  Enter: 'confirm',
  Escape: 'cancel',
};
export class Input {
  private abort = new AbortController();
  private pointer: number | null = null;
  private held = new Set<Action>();
  constructor(surface: HTMLCanvasElement, viewport: Viewport, emit: (event: GameInput) => void) {
    const options = { signal: this.abort.signal };
    for (const [native, type] of [
      ['pointerdown', 'down'],
      ['pointermove', 'move'],
      ['pointerup', 'up'],
      ['pointercancel', 'up'],
    ] as const) {
      surface.addEventListener(
        native,
        (event) => {
          if (type === 'down') {
            if (this.pointer !== null) return;
            this.pointer = event.pointerId;
            surface.setPointerCapture(event.pointerId);
          } else if (this.pointer !== event.pointerId) return;
          const p = logicalPoint(event.clientX, event.clientY, viewport.layout);
          emit({ type, ...p });
          if (type === 'up') {
            this.pointer = null;
            if (surface.hasPointerCapture(event.pointerId))
              surface.releasePointerCapture(event.pointerId);
          }
        },
        options,
      );
    }
    surface.addEventListener('contextmenu', (e) => e.preventDefault(), options);
    for (const type of ['keydown', 'keyup'] as const)
      window.addEventListener(
        type,
        (event) => {
          const action = keys[event.key];
          if (
            !action ||
            event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLSelectElement ||
            event.target instanceof HTMLButtonElement
          )
            return;
          if (document.body.classList.contains('playing')) event.preventDefault();
          if (type === 'keydown' && event.repeat) return;
          if (type === 'keydown') this.held.add(action);
          else this.held.delete(action);
          emit({ type: 'action', action, pressed: type === 'keydown' });
        },
        options,
      );
    window.addEventListener(
      'blur',
      () => {
        for (const action of this.held) emit({ type: 'action', action, pressed: false });
        this.held.clear();
      },
      options,
    );
  }
  destroy(): void {
    this.abort.abort();
  }
}
