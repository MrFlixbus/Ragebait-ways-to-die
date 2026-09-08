import type { ScenarioDefinition } from '../../core/types';
import { box, text, line, character, room, button, hit, sticker, ellipse } from '../../art/draw';
export const paperwork: ScenarioDefinition = {
  id: 'paperwork',
  title: 'FEED THE MACHINE',
  command: 'Stop the office from eating you.',
  hint: 'DRAG / ARROWS + SPACE',
  duration: 9,
  color: '#9acbe7',
  music: [48, 55, 60, 55, 51, 58, 63, 58],
  timeout: 'The printer promoted you to lunch. Feed it the resignation letter.',
  create(ctx) {
    let px = 252,
      py = 316,
      dragging = false,
      result = '',
      elapsed = 0;
    const finish = (success: boolean) => {
      if (result) return;
      result = success ? 'good' : 'bad';
      ctx.finish(
        success,
        success
          ? 'You quit. The printer lost its appetite.'
          : 'PRINT made more work. You were the consumable. Drag your resignation into its mouth.',
      );
    };
    return {
      update(dt) {
        elapsed += dt;
      },
      input(e) {
        if (result) return;
        if (e.type === 'down') {
          if (hit(e.x, e.y, px - 64, py - 48, 128, 96)) {
            dragging = true;
            ctx.sound('tap');
          } else if (hit(e.x, e.y, 618, 427, 180, 54)) finish(false);
        }
        if (e.type === 'move' && dragging) {
          px = Math.max(64, Math.min(896, e.x));
          py = Math.max(150, Math.min(465, e.y));
        }
        if (e.type === 'up' && dragging) {
          dragging = false;
          if (hit(px, py, 560, 238, 285, 135)) finish(true);
        }
        if (e.type === 'action' && e.pressed) {
          if (e.action === 'confirm') {
            ctx.sound('tap');
            if (hit(px, py, 560, 238, 285, 135)) finish(true);
          }
          if (e.action === 'right') px += 115;
          if (e.action === 'left') px -= 115;
          if (e.action === 'up') py -= 70;
          if (e.action === 'down') py += 70;
          px = Math.max(64, Math.min(896, px));
          py = Math.max(150, Math.min(460, py));
        }
      },
      draw(c, t) {
        room(c, '#b3d5e5', '#90b7cb');
        box(c, 52, 111, 216, 116, '#e8f2ed', 4);
        text(c, 'WE ARE A FAMILY.', 160, 142, 18);
        text(c, '(please do not leave)', 160, 178, 15);
        line(c, [48, 420, 345, 420], '#202125', 12);
        line(c, [72, 420, 64, 506], '#202125', 10);
        const shake =
          result === 'bad' ? Math.sin(t * 50) * (ctx.reducedMotion ? 0 : 10) : Math.sin(t * 3) * 3;
        c.save();
        c.translate(shake, 0);
        box(c, 546, 180, 300, 213, '#e4e6dc', 22);
        box(c, 585, 136, 217, 62, '#f6f5e9', 8);
        box(c, 565, 249, 260, 113, '#202125', 14);
        for (let i = 0; i < 7; i++) {
          c.fillStyle = '#fff9e9';
          c.beginPath();
          c.moveTo(577 + i * 34, 250);
          c.lineTo(604 + i * 34, 250);
          c.lineTo(590 + i * 34, 278);
          c.fill();
          c.beginPath();
          c.moveTo(577 + i * 34, 360);
          c.lineTo(604 + i * 34, 360);
          c.lineTo(590 + i * 34, 334);
          c.fill();
        }
        ellipse(c, 640, 221, 12, 8, '#ff7955');
        ellipse(c, 751, 221, 12, 8, '#ff7955');
        text(c, result === 'good' ? 'NO EMPLOYEE FOUND' : 'FEED ME PAPERWORK', 696, 166, 16);
        c.restore();
        button(c, 'PRINT  +1,000', 618, 427, 180, '#f995c5');
        if (result !== 'good') {
          c.save();
          c.translate(px, py);
          c.rotate(dragging ? -0.1 : 0.07);
          box(c, -61, -46, 122, 92, '#fff9e9', 3, 3);
          text(c, 'I QUIT.', 0, -14, 24);
          line(c, [-39, 12, 37, 12], '#202125', 2);
          line(c, [-39, 24, 20, 24], '#202125', 2);
          c.restore();
        }
        if (result === 'bad') {
          c.save();
          c.translate(665, 328);
          c.rotate(ctx.reducedMotion ? 1 : elapsed * 6);
          character(c, 0, 0, 0.65, 'dead');
          c.restore();
        } else
          character(
            c,
            result === 'good' ? 381 : 416,
            362,
            0.73,
            result === 'good' ? 'happy' : 'panic',
            ctx.reducedMotion ? 0 : t,
          );
        sticker(
          c,
          result === 'good' ? 'OUT OF OFFICE. FOREVER.' : 'PAPER IN. PROBLEMS OUT.',
          468,
          503,
          285,
          '#fff9e9',
        );
      },
      destroy() {
        dragging = false;
      },
    };
  },
};
