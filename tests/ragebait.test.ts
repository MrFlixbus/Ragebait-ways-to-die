import { describe, it, expect, vi } from 'vitest';
import { elevator } from '../src/scenarios/elevator';
import { crossing } from '../src/scenarios/crossing';
import { defuse } from '../src/scenarios/defuse';
import { difficultyFor } from '../src/core/rules';
import type { ScenarioContext, ScenarioInstance } from '../src/core/types';

const context = (score: number): ScenarioContext => ({
  difficulty: difficultyFor(score),
  reducedMotion: true,
  finish: vi.fn(),
  sound: vi.fn(),
});
const advance = (s: ScenarioInstance, seconds: number) => {
  for (let left = seconds; left > 1e-9;) {
    const dt = Math.min(left, 1 / 120);
    s.update(dt);
    left -= dt;
  }
};
const key = (s: ScenarioInstance, pressed = true) =>
  s.input({ type: 'action', action: 'confirm', pressed });

describe('ragebait scenarios', () => {
  it.each([0, 1000])('elevator supports pointer and keyboard at score %s', (score) => {
    for (const pointer of [true, false]) {
      const c = context(score),
        s = elevator.create(c);
      if (pointer) s.input({ type: 'down', x: 750, y: 440 });
      else key(s);
      advance(s, 4 / (1 + (c.difficulty.speed - 1) * 0.45));
      if (pointer) s.input({ type: 'up', x: 0, y: 0 });
      else key(s, false);
      expect(c.finish).toHaveBeenCalledWith(true, expect.any(String));
      advance(s, 5);
      key(s);
      key(s, false);
      expect(c.finish).toHaveBeenCalledTimes(1);
    }
  });
  it.each([1.3, 2.6, 4.4])('elevator punishes fake stops and late release at %s', (seconds) => {
    const c = context(0),
      s = elevator.create(c);
    key(s);
    advance(s, seconds);
    key(s, false);
    expect(c.finish).toHaveBeenCalledWith(false, expect.any(String));
    expect(c.finish).toHaveBeenCalledTimes(1);
  });
  it('elevator requires grabbing the override', () => {
    const c = context(0),
      s = elevator.create(c);
    advance(s, 1.6);
    expect(c.finish).toHaveBeenCalledWith(false, expect.any(String));
  });
  it.each([0, 1000])('crossing can be crossed in three camera naps at score %s', (score) => {
    for (const pointer of [true, false]) {
      const c = context(score),
        s = crossing.create(c),
        speed = c.difficulty.speed;
      for (let lap = 0; lap < 3; lap++) {
        if (pointer) s.input({ type: 'down', x: 480, y: 450 });
        else key(s);
        advance(s, 0.96 / speed);
        if (pointer) s.input({ type: 'up', x: 0, y: 0 });
        else key(s, false);
        if (lap < 2) advance(s, 1.04 / speed);
      }
      expect(c.finish).toHaveBeenCalledWith(true, expect.any(String));
      advance(s, 5);
      key(s);
      expect(c.finish).toHaveBeenCalledTimes(1);
      expect(4.96 / speed).toBeLessThan(crossing.duration * c.difficulty.timeScale);
    }
  });
  it('crossing kills walking through the shutter transition, including a long frame', () => {
    const c = context(0),
      s = crossing.create(c);
    key(s);
    s.update(2);
    expect(c.finish).toHaveBeenCalledWith(false, expect.any(String));
  });
  it('crossing allows stopping throughout the watching phase', () => {
    const c = context(0),
      s = crossing.create(c);
    key(s);
    advance(s, 0.8);
    key(s, false);
    advance(s, 1.2);
    expect(c.finish).not.toHaveBeenCalled();
  });
  it.each([0, 1000])('defuse permits all three reversed cuts at score %s', (score) => {
    for (const pointer of [true, false]) {
      const c = context(score),
        s = defuse.create(c),
        speed = c.difficulty.speed;
      for (const seconds of [0.66 / (0.48 * speed), 0.41 / (0.58 * speed), 0.5 / (0.68 * speed)]) {
        advance(s, seconds);
        if (pointer) s.input({ type: 'down', x: 720, y: 450 });
        else {
          key(s);
          key(s, false);
        }
      }
      expect(c.finish).toHaveBeenCalledWith(true, expect.any(String));
      key(s);
      advance(s, 10);
      expect(c.finish).toHaveBeenCalledTimes(1);
    }
  });
  it('defuse punishes mashing after a correct cut', () => {
    const c = context(0),
      s = defuse.create(c);
    advance(s, 0.66 / 0.48);
    key(s);
    key(s, false);
    key(s);
    expect(c.finish).toHaveBeenCalledWith(false, expect.any(String));
  });
  it('defuse punishes cutting outside green', () => {
    const c = context(0),
      s = defuse.create(c);
    key(s);
    expect(c.finish).toHaveBeenCalledWith(false, expect.any(String));
  });
  it.each([elevator, crossing, defuse])(
    '$id ignores stray input and stops after destruction',
    (definition) => {
      const c = context(0),
        s = definition.create(c);
      s.input({ type: 'down', x: 5, y: 5 });
      s.input({ type: 'up', x: 5, y: 5 });
      expect(c.finish).not.toHaveBeenCalled();
      s.destroy();
      key(s);
      key(s, false);
      advance(s, 20);
      expect(c.finish).not.toHaveBeenCalled();
    },
  );
});
