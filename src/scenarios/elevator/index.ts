import type { ScenarioDefinition } from '../../core/types';
import {
  box,
  text,
  line,
  character,
  room,
  button,
  hit,
  sticker,
  palette as p,
} from '../../art/draw';

export const elevator: ScenarioDefinition = {
  id: 'elevator',
  title: 'HOLD THE DOOR',
  command: 'Your exit has commitment issues.',
  hint: 'HOLD BUTTON / SPACE — RELEASE ONLY AT EXIT',
  duration: 9,
  color: p.blue,
  music: [55, 62, 58, 55, 67, 58, 62, 49],
  timeout:
    'You live here now. Hold the override through both fake dings. Release when the doors show EXIT.',
  create(ctx) {
    let elapsed = 0,
      ride = 0,
      held = false,
      started = false,
      result = '';
    const speed = 1 + (ctx.difficulty.speed - 1) * 0.45;
    const open = () => ride >= 3.8 && ride <= 4.3;
    const finish = (success: boolean, message: string) => {
      if (result) return;
      result = success ? 'good' : 'bad';
      held = false;
      ctx.finish(success, message);
    };
    const press = () => {
      if (!held) {
        held = true;
        started = true;
        ctx.sound('tap');
      }
    };
    const release = () => {
      if (!held) return;
      held = false;
      finish(
        open(),
        open()
          ? 'You declined two floors of certain death. Excellent commute.'
          : 'DING is a sound, not a safety certificate. Hold through both fake stops; release at the open EXIT.',
      );
    };
    return {
      update(dt) {
        if (result) return;
        elapsed += dt;
        if (!started && elapsed > 1.5)
          finish(
            false,
            'The elevator left without your survival instinct. Hold the override immediately.',
          );
        if (held) {
          const previous = ride;
          ride += dt * speed;
          for (const ding of [1.2, 2.5, 3.8])
            if (previous < ding && ride >= ding) ctx.sound(ding === 3.8 ? 'good' : 'step');
          if (ride > 4.3)
            finish(
              false,
              'You held the door so hard it held you back. Release during the half-second EXIT opening.',
            );
        }
      },
      input(e) {
        if (result) return;
        if (e.type === 'down' && hit(e.x, e.y, 620, 408, 270, 64)) press();
        if (e.type === 'up') release();
        if (e.type === 'action' && e.action === 'confirm') {
          if (e.pressed) press();
          else release();
        }
      },
      draw(c, t) {
        room(c, '#acd0dc', '#779aa8');
        box(c, 155, 111, 410, 369, p.ink, 12);
        box(c, 170, 126, 380, 339, open() || result === 'good' ? p.lime : '#485766', 4);
        const gap = open() || result === 'good' ? 148 : result === 'bad' ? 0 : 10;
        text(c, 'EXIT', 360, 196, 42);
        line(c, [320, 240, 400, 240, 380, 220, 400, 240, 380, 260], p.ink, 9);
        for (const side of [-1, 1]) {
          const x = side < 0 ? 170 : 360 + gap;
          box(c, x, 126, 190 - gap, 339, '#c4d2d4', 2);
          box(c, x + 8, 137, 15, 315, '#e9efeb', 1, 0);
        }
        character(
          c,
          365,
          375,
          result === 'bad' ? 0.3 : 0.78,
          result === 'bad' ? 'dead' : result === 'good' ? 'happy' : 'panic',
          ctx.reducedMotion ? 0 : t,
        );
        const fake = (ride >= 1.2 && ride < 1.7) || (ride >= 2.5 && ride < 3);
        box(c, 616, 125, 277, 145, p.cream, 8);
        text(c, open() ? 'EXIT OPEN' : fake ? 'DING! ARRIVED*' : 'PLEASE HOLD', 754, 161, 26);
        text(
          c,
          open()
            ? 'RELEASE. NOW.'
            : fake
              ? '*emotionally'
              : started
                ? 'DOORS STILL LOCKED'
                : 'GRAB THE OVERRIDE',
          754,
          204,
          18,
        );
        text(
          c,
          'FLOOR ' + (ride < 1.2 ? '01' : ride < 2.5 ? '02' : ride < 3.8 ? '03' : 'EXIT'),
          754,
          245,
          18,
        );
        sticker(c, 'DINGS ARE NOT EXITS', 755, 315, 273, p.pink);
        for (let i = 0; i < 3; i++)
          box(c, 665 + i * 64, 358, 42, 20, ride >= [1.2, 2.5, 3.8][i] ? p.lime : '#647e89', 4);
        button(c, held ? 'HOLDING…' : 'HOLD OVERRIDE', 620, 408, 270, held ? p.orange : p.lime);
        text(c, 'THANK YOU FOR YOUR PATIENCE. LOL.', 480, 495, 18);
      },
      destroy() {
        result = 'destroyed';
        held = false;
      },
    };
  },
};
