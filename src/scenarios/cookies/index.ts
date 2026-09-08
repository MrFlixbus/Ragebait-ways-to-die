import type { ScenarioDefinition } from '../../core/types';
import { box, text, line, character, room, button, hit, ellipse } from '../../art/draw';
export const cookies: ScenarioDefinition = {
  id: 'cookies',
  title: 'ACCEPT ALL COOKIES',
  command: 'The internet wants to eat you.',
  hint: 'TAP THE COOKIE / PRESS SPACE REPEATEDLY',
  duration: 7,
  color: '#bdaef0',
  music: [60, 63, 67, 72, 70, 67, 63, 58],
  timeout: 'The cookies ate you first. Click the actual cookie six times. Consent is not a snack.',
  create(ctx) {
    let bites = 0,
      result = '',
      pulse = 0,
      elapsed = 0;
    const total = 6 + Math.min(3, ctx.difficulty.level);
    const eat = () => {
      if (result) return;
      bites++;
      pulse = 1;
      ctx.sound('tap');
      if (bites >= total) {
        result = 'good';
        ctx.finish(true, 'You ate the tracking cookies. Your stomach is now incognito.');
      }
    };
    const fail = () => {
      if (result) return;
      result = 'bad';
      ctx.finish(
        false,
        'ACCEPT ALL gave the cookies permission to eat YOU. Click the edible cookie instead.',
      );
    };
    return {
      update(dt) {
        pulse = Math.max(0, pulse - dt * 5);
        elapsed += dt;
      },
      input(e) {
        if (result) return;
        if (e.type === 'action' && e.pressed && e.action === 'confirm') eat();
        if (e.type === 'down') {
          if (hit(e.x, e.y, 370, 182, 215, 180)) eat();
          else if (hit(e.x, e.y, 555, 381, 254, 60)) fail();
          else if (hit(e.x, e.y, 758, 138, 64, 50)) {
            ctx.sound('bad');
            pulse = 0.4;
          }
        }
      },
      draw(c, t) {
        room(c, '#b7ace0', '#9383bc');
        for (let i = 0; i < 5; i++) {
          const xx = 85 + i * 181;
          ellipse(
            c,
            xx,
            164 + (ctx.reducedMotion ? 0 : Math.sin(t + i) * 12),
            47,
            43,
            '#d1a25f',
            4,
          );
          ellipse(c, xx - 14, 153, 6, 9, '#202125');
          ellipse(c, xx + 14, 153, 6, 9, '#202125');
          line(c, [xx - 19, 179, xx, 187, xx + 19, 179]);
        }
        character(
          c,
          138,
          384,
          result === 'bad' ? 0.43 : 0.9,
          result === 'bad' ? 'dead' : result === 'good' ? 'happy' : 'panic',
          ctx.reducedMotion ? 0 : t,
        );
        box(c, 268, 149, 566, 301, '#202125', 14);
        box(c, 257, 138, 566, 301, '#fff9e9', 14);
        box(c, 258, 138, 565, 48, '#202125', 10, 0);
        text(c, 'A WORD FROM OUR COOKIES', 534, 163, 21, '#fff9e9');
        text(c, '×', 789, 163, 28, '#fff9e9');
        const scale = ctx.reducedMotion ? 1 : 1 + pulse * 0.08;
        c.save();
        c.translate(478, 273);
        c.scale(scale, scale);
        if (result !== 'good') {
          ellipse(c, 0, 0, 74, 70, '#d1a25f', 5);
          ellipse(c, 8, 7, 62, 59, '#b48343');
          for (const [x, y] of [
            [-35, -28],
            [15, -37],
            [44, 7],
            [-28, 28],
            [12, 40],
            [-2, -2],
          ])
            box(c, x - 5, y - 5, 12, 12, '#65482e', 3, 0);
          for (let i = 0; i < bites; i++)
            ellipse(c, Math.cos(i * 0.8) * 63, Math.sin(i * 0.8) * 59, 23, 23, '#fff9e9');
        } else {
          text(c, 'BURP.', 0, 0, 38);
        }
        c.restore();
        text(c, 'YOU ARE', 690, 224, 20);
        text(c, 'WHAT THEY EAT.', 690, 250, 20);
        text(c, 'Edible. Tap to consume.', 477, 358, 17);
        button(c, 'ACCEPT ALL', 555, 380, 254, '#d5fa43');
        text(c, `${bites} / ${total} BITES`, 389, 406, 20);
        text(c, 'We value your privacy. And your delicious organs.', 530, 476, 20);
        if (result === 'bad') {
          ellipse(
            c,
            137,
            357,
            73 + (ctx.reducedMotion ? 0 : Math.sin(elapsed * 15) * 7),
            60,
            '#d1a25f',
            5,
          );
          line(c, [88, 356, 115, 379, 139, 355, 161, 379, 187, 354], '#202125', 7);
        }
      },
      destroy() {
        pulse = 0;
      },
    };
  },
};
