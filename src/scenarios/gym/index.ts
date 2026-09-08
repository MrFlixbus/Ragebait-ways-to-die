import type { ScenarioDefinition } from '../../core/types';
import { box, text, line, character, room, button, hit, ellipse, sticker } from '../../art/draw';
export const gym: ScenarioDefinition = {
  id: 'gym',
  title: 'DEAD LIFT',
  command: 'Meet your personal terminator.',
  hint: 'TAP / SPACE AT THE RIGHT TIME',
  duration: 9,
  color: '#f995c5',
  music: [48, 48, 60, 55, 48, 58, 55, 60],
  timeout:
    'Your trainer spotted you. Then flattened you. Ring the bell during its mandatory REST break.',
  create(ctx) {
    let elapsed = 0,
      result = '',
      impact = 0;
    const phase = () => (elapsed * ctx.difficulty.speed) % 2.7;
    const ring = () => {
      if (result) return;
      ctx.sound('tap');
      const success = phase() >= 1.65 && phase() <= 2.5;
      result = success ? 'good' : 'bad';
      ctx.finish(
        success,
        success
          ? 'Mandatory break. Even killer robots have a union.'
          : 'You called for a spot. It spotted a weakness. Ring only during REST.',
      );
    };
    return {
      update(dt) {
        elapsed += dt;
        impact = Math.max(0, impact - dt);
      },
      input(e) {
        if (result) return;
        if (e.type === 'down' && hit(e.x, e.y, 583, 416, 228, 60)) ring();
        if (e.type === 'action' && e.pressed && e.action === 'confirm') ring();
      },
      draw(c, t) {
        room(c, '#ecadce', '#c887ab');
        box(c, 44, 113, 203, 130, '#fff9e9', 5);
        text(c, 'NO PAIN.', 146, 151, 25);
        text(c, 'NO REFUND.', 146, 186, 25);
        line(c, [293, 418, 293, 158, 862, 158, 862, 418], '#202125', 12);
        const rest = phase() >= 1.65 && phase() <= 2.5;
        box(c, 375, 117, 338, 48, rest ? '#d5fa43' : '#202125', 5);
        text(
          c,
          rest ? 'REST — UNION RULES' : 'WORK — NO EXCUSES',
          544,
          141,
          21,
          rest ? '#202125' : '#fff9e9',
        );
        const lift = result === 'bad' ? 370 : 234 + (ctx.reducedMotion ? 0 : Math.sin(t * 3) * 9);
        character(
          c,
          434,
          result === 'bad' ? 427 : 355,
          result === 'bad' ? 0.45 : 0.75,
          result === 'bad' ? 'dead' : result === 'good' ? 'happy' : 'panic',
          ctx.reducedMotion ? 0 : t,
        );
        line(c, [326, lift, 540, lift], '#202125', 13);
        for (const x of [322, 530]) {
          box(c, x, lift - 44, 25, 88, '#595969', 4);
          box(c, x - 18, lift - 28, 19, 56, '#202125', 3);
        }
        box(c, 632, 235, 115, 125, '#afbab4', 12);
        box(c, 640, 175, 97, 74, '#e5e9dc', 13);
        line(c, [650, 203, 670, 212], '#ff453b', 6);
        line(c, [721, 203, 701, 212], '#ff453b', 6);
        text(c, rest || result === 'good' ? 'OFF' : 'KILL', 690, 230, 17);
        line(c, [649, 361, 631, 410, 605, 410], '#202125', 14);
        line(c, [730, 361, 751, 410, 778, 410], '#202125', 14);
        line(c, [632, 266, 585, rest || result === 'good' ? 324 : lift, 549, lift], '#202125', 13);
        line(c, [746, 266, 789, 280, 814, 247], '#202125', 13);
        ellipse(c, 691, 290, 25, 25, '#f995c5', 4);
        text(c, 'PT', 691, 290, 20);
        button(c, 'RING FOR A SPOT', 583, 416, 228, '#d5fa43');
        box(c, 310, 482, 330, 17, '#202125', 6, 0);
        box(c, 310 + (330 * 1.65) / 2.7, 482, (330 * 0.85) / 2.7, 17, '#d5fa43', 1, 0);
        line(c, [310 + (phase() / 2.7) * 330, 477, 310 + (phase() / 2.7) * 330, 504], '#fff9e9', 5);
        sticker(c, 'TIMING > MUSCLES', 152, 473, 228, '#fff9e9');
      },
      destroy() {
        impact = 0;
      },
    };
  },
};
