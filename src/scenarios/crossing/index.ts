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

export const crossing: ScenarioDefinition = {
  id: 'crossing',
  title: 'CROSS MY HEART',
  command: 'The WALK sign is sponsored by your replacement.',
  hint: 'HOLD BUTTON / RIGHT / SPACE TO WALK — RELEASE TO STOP',
  duration: 12,
  color: p.lime,
  music: [48, 60, 48, 61, 55, 58, 43, 55],
  timeout:
    'The commute claimed another temp. Move while the camera says BLIND; stop before its shutter opens. The WALK sign lies.',
  create(ctx) {
    let elapsed = 0,
      x = 130,
      held = false,
      result = '';
    const speed = ctx.difficulty.speed;
    const phase = () => (elapsed * speed) % 2;
    const finish = (success: boolean, message: string) => {
      if (result) return;
      result = success ? 'good' : 'bad';
      held = false;
      ctx.finish(success, message);
    };
    return {
      update(dt) {
        if (result) return;
        // Small simulation steps prevent walking through a shutter transition on a slow frame.
        for (let remaining = dt; remaining > 0 && !result;) {
          const step = Math.min(remaining, 1 / 240);
          remaining -= step;
          elapsed += step;
          if (!held) continue;
          if (phase() >= 1.1) {
            finish(
              false,
              'The WALK sign works for the camera. Walk only while BLIND; BRAKING is your warning to let go.',
            );
            break;
          }
          x += step * 245 * speed;
          if (x >= 810) finish(true, 'Three camera naps. One unpaid lunch break.');
        }
      },
      input(e) {
        if (result) return;
        if (e.type === 'down' && hit(e.x, e.y, 337, 427, 286, 64)) held = true;
        if (e.type === 'up') held = false;
        if (e.type === 'action' && (e.action === 'right' || e.action === 'confirm'))
          held = e.pressed;
      },
      draw(c, t) {
        room(c, '#d4ddbc', '#8e9a8b');
        box(c, 50, 295, 860, 119, '#515763', 5);
        for (let i = 0; i < 9; i++) box(c, 100 + i * 87, 310, 47, 86, p.cream, 0, 0);
        line(c, [810, 292, 810, 413], p.lime, 8);
        sticker(c, 'LUNCH →', 817, 251, 160, p.lime);
        line(c, [665, 155, 665, 289], p.ink, 12);
        box(c, 589, 117, 152, 66, phase() >= 1.1 ? p.lime : p.pink, 8);
        text(c, phase() >= 1.1 ? 'WALK :)' : 'WAIT :(', 665, 150, 25);
        const blind = phase() < 1.1;
        box(c, 281, 122, 246, 111, '#8eabb0', 12);
        box(c, 290, 130, 228, 24, '#c9dee0', 5, 0);
        ellipse(c, 400, 183, 46, 34, p.cream, 5);
        if (blind) line(c, [365, 183, 435, 183], p.ink, 9);
        else {
          ellipse(c, 400, 183, 25, 28, p.orange, 3);
          ellipse(c, 400, 183, 10, 15, p.ink);
        }
        text(
          c,
          blind ? (phase() >= 0.8 ? 'BRAKING! RELEASE!' : 'BLIND — GO!') : 'WATCHING — STOP',
          401,
          258,
          22,
        );
        box(c, 292, 278, 220, 8, p.ink, 1, 0);
        box(c, 292, 278, 220 * (phase() / 2), 8, blind ? p.lime : p.orange, 1, 0);
        if (!blind && !ctx.reducedMotion) line(c, [400, 220, x, 345], '#ff795570', 3);
        character(
          c,
          x,
          350,
          0.57,
          result === 'bad' ? 'dead' : result === 'good' ? 'happy' : 'panic',
          held && !ctx.reducedMotion ? t * 2 : 0,
        );
        button(c, held ? 'WALKING…' : 'HOLD TO WALK', 337, 427, 286, held ? p.orange : p.lime);
        text(c, 'TRUST THE SHUTTER.', 164, 457, 16);
        text(c, 'NOT THE SIGN.', 790, 457, 16);
        text(c, `${Math.min(100, Math.floor((x - 130) / 6.8))}% EMPLOYABLE`, 480, 507, 16);
      },
      destroy() {
        held = false;
        result = 'destroyed';
      },
    };
  },
};
