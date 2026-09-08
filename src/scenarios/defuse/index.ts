import type { ScenarioDefinition } from '../../core/types';
import {
  box,
  text,
  line,
  ellipse,
  character,
  room,
  button,
  hit,
  sticker,
  palette as p,
} from '../../art/draw';

export const defuse: ScenarioDefinition = {
  id: 'defuse',
  title: 'TERMS & DETONATION',
  command: 'Three cuts. The fine print cuts back.',
  hint: 'TAP CUT / SPACE IN THE GREEN ZONE — THREE TIMES',
  duration: 12,
  color: p.orange,
  music: [40, 52, 43, 55, 46, 58, 43, 39],
  timeout:
    'Your free trial of being alive expired. Make three cuts in green. Every cut reverses the needle and moves the target.',
  create(ctx) {
    let needle = 0.06,
      cuts = 0,
      direction = 1,
      result = '';
    const targets = [0.72, 0.31, 0.81];
    const width = Math.max(0.105, 0.15 - ctx.difficulty.level * 0.006);
    const finish = (success: boolean, message: string) => {
      if (result) return;
      result = success ? 'good' : 'bad';
      ctx.finish(success, message);
    };
    const cut = () => {
      if (Math.abs(needle - targets[cuts]) > width / 2) {
        finish(
          false,
          'You accepted the explosive terms. Cut only in green; each successful cut reverses the needle AND moves green.',
        );
        return;
      }
      cuts++;
      direction *= -1;
      ctx.sound('good');
      if (cuts === 3) finish(true, 'Unsubscribed from the mortal coil. Wait. The opposite.');
    };
    return {
      update(dt) {
        if (result) return;
        needle =
          (((needle + direction * dt * (0.48 + cuts * 0.1) * ctx.difficulty.speed) % 1) + 1) % 1;
      },
      input(e) {
        if (result) return;
        if (
          (e.type === 'down' && hit(e.x, e.y, 586, 426, 285, 64)) ||
          (e.type === 'action' && e.action === 'confirm' && e.pressed)
        )
          cut();
      },
      draw(c, t) {
        room(c, '#ecc3a5', '#bb8e7c');
        sticker(c, 'FREE TRIAL: LIFE', 195, 151, 242, p.cream);
        character(
          c,
          198,
          339,
          0.97,
          result === 'bad' ? 'dead' : result === 'good' ? 'happy' : 'panic',
          ctx.reducedMotion ? 0 : t,
        );
        box(c, 355, 137, 530, 259, '#5c626c', 16);
        box(c, 365, 147, 510, 24, '#9298a1', 7, 0);
        for (const x of [375, 865])
          for (const y of [157, 377]) {
            ellipse(c, x, y, 6, 6, p.cream, 2);
            line(c, [x - 3, y, x + 3, y], p.ink, 2);
          }
        box(c, 398, 184, 443, 57, p.ink, 5);
        text(
          c,
          result === 'bad'
            ? 'SUBSCRIPTION TERMINATED'
            : cuts === 3
              ? 'CONTRACT CANCELLED'
              : cuts === 0
                ? 'PLEASE ACCEPT ALL RISKS'
                : 'UPDATED TERMS. READ AGAIN.',
          619,
          213,
          20,
          result === 'bad' ? p.orange : p.lime,
        );
        for (let i = 0; i < 3; i++) {
          const y = 263 + i * 37;
          line(c, [402, y, 465, y, 485, y + 12, 535, y + 12], [p.pink, p.blue, p.orange][i], 9);
          line(c, [cuts > i ? 565 : 535, y + 12, 597, y, 670, y], [p.pink, p.blue, p.orange][i], 9);
          text(c, cuts > i ? 'CUT ✓' : 'LIVE', 762, y + 4, 20, cuts > i ? p.lime : p.cream);
        }
        box(c, 69, 423, 456, 53, p.ink, 8);
        if (cuts < 3)
          box(c, 83 + (targets[cuts] - width / 2) * 428, 430, width * 428, 39, p.lime, 3, 0);
        line(c, [83 + needle * 428, 420, 83 + needle * 428, 478], p.cream, 5);
        button(c, cuts === 3 ? 'DEFUSED' : `CUT ${cuts + 1} / 3`, 586, 426, 285, p.orange);
        text(c, direction > 0 ? 'NEEDLE →' : '← NEEDLE REVERSED', 295, 498, 18);
        text(c, 'EACH CUT MOVES GREEN + REVERSES', 720, 498, 14);
      },
      destroy() {
        result = 'destroyed';
      },
    };
  },
};
