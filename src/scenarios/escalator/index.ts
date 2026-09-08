import type { ScenarioDefinition } from '../../core/types';
import { box, text, line, character, room, button, hit, sticker } from '../../art/draw';
export const escalator: ScenarioDefinition = {
  id: 'escalator',
  title: 'CAREER ESCALATOR',
  command: 'Find a healthy work–life exit.',
  hint: 'HOLD ◀ / ▶ OR A / D',
  duration: 9,
  color: '#d5fa43',
  music: [52, 59, 64, 62, 52, 59, 67, 64],
  timeout: 'You went nowhere, professionally. Hold LEFT toward the actual exit.',
  create(ctx) {
    let x = 480,
      direction = 0,
      time = 0,
      result = '';
    const finish = (success: boolean) => {
      if (result) return;
      result = success ? 'good' : 'bad';
      direction = 0;
      ctx.finish(
        success,
        success
          ? 'You left the company. Literally.'
          : 'UPPER MANAGEMENT was a ceiling shredder. The exit was left. Hold LEFT.',
      );
    };
    return {
      update(dt) {
        time += dt;
        if (result) return;
        x += (46 * ctx.difficulty.speed + direction * 205) * dt;
        if (x < 165) finish(true);
        if (x > 778) finish(false);
      },
      input(e) {
        if (result) return;
        if (e.type === 'action') {
          if (e.pressed && (e.action === 'left' || e.action === 'right')) ctx.sound('step');
          if (e.action === 'left') direction = e.pressed ? -1 : direction === -1 ? 0 : direction;
          if (e.action === 'right') direction = e.pressed ? 1 : direction === 1 ? 0 : direction;
        }
        if (e.type === 'down' || e.type === 'move') {
          if (hit(e.x, e.y, 245, 427, 220, 80)) direction = -1;
          else if (hit(e.x, e.y, 495, 427, 220, 80)) direction = 1;
          else direction = 0;
        }
        if (e.type === 'down' && direction) ctx.sound('step');
        if (e.type === 'up') direction = 0;
      },
      draw(c, t) {
        room(c, '#dce9b5', '#abbc8d');
        box(c, 54, 182, 142, 213, '#456058', 4);
        box(c, 65, 196, 120, 198, '#243832', 2);
        sticker(c, '← EXIT', 126, 152, 150, '#fff9e9');
        line(c, [235, 398, 833, 238], '#202125', 19);
        line(c, [230, 353, 823, 193], '#202125', 8);
        c.save();
        c.beginPath();
        c.moveTo(214, 366);
        c.lineTo(826, 201);
        c.lineTo(850, 259);
        c.lineTo(232, 420);
        c.closePath();
        c.fillStyle = '#738173';
        c.fill();
        c.clip();
        for (let i = -2; i < 23; i++) {
          const sx = 180 + i * 34 + (ctx.reducedMotion ? 0 : (time * 46) % 34);
          line(c, [sx, 160, sx + 66, 480], '#202125', 5);
        }
        c.restore();
        box(c, 780, 116, 134, 172, '#202125', 6);
        text(c, 'UPPER', 847, 140, 17, '#d5fa43');
        text(c, 'MANAGEMENT', 847, 162, 12, '#d5fa43');
        for (let i = 0; i < 5; i++) {
          const xx = 790 + i * 23;
          line(c, [xx, 200, xx + 10, 247, xx + 20, 200], '#c9d4bf', 8);
        }
        text(c, 'PROMOTION →', 588, 177, 24);
        text(c, 'only one way up!', 586, 206, 16);
        const yy = 362 - (x - 240) * 0.266;
        if (result === 'bad') {
          c.save();
          c.translate(816, 243);
          c.rotate(ctx.reducedMotion ? 1 : time * 8);
          character(c, 0, 0, 0.36, 'dead');
          c.restore();
        } else
          character(
            c,
            x,
            yy - 47,
            0.62,
            result === 'good' ? 'happy' : 'panic',
            ctx.reducedMotion ? 0 : t * (direction ? 2 : 1),
          );
        button(c, '◀  WALK LEFT', 260, 444, 190, direction === -1 ? '#fff9e9' : '#d5fa43');
        button(c, 'CLIMB RIGHT  ▶', 510, 444, 190, '#f995c5');
      },
      destroy() {
        direction = 0;
      },
    };
  },
};
